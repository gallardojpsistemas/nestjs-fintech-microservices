import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { serviceCall } from 'src/common/service-call-util';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class WalletService {
    constructor(
        @InjectModel(Wallet.name)
        private readonly walletModel: Model<WalletDocument>,
        private readonly configService: ConfigService,
        private readonly amqpConnection: AmqpConnection,
    ) { }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'user.created',
        queue: 'wallet_users_queue',
    })
    async handleUserCreated(data: any) {
        const payload = data?.data ?? data;
        const { userId } = payload;
        console.log('user.created event received in service:', userId);
        await this.createWallet(userId);
    }

    async createWallet(userId: string) {
        return this.walletModel.create({ userId });
    }

    async getWallet(userId: string) {
        return this.walletModel.findOne({ userId });
    }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'wallet.deposit',
        queue: 'wallet_deposit_queue',
    })
    async handleWalletDeposit(data: { userId: string; amount: number }) {
        console.log(`[WalletService] Received background deposit for user ${data.userId}: $${data.amount}`);
        try {
            await this.deposit(data.userId, data.amount);
        } catch (error) {
            console.error(`[WalletService] Error processing deposit for user ${data.userId}:`, error);
        }
    }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'wallet.withdraw',
        queue: 'wallet_withdraw_queue',
    })
    async handleWalletWithdraw(data: { userId: string; amount: number; type: LedgerOperationType }) {
        console.log(`[WalletService] Received background withdraw for user ${data.userId}: $${data.amount}`);
        try {
            await this.withdraw(data.userId, data.amount, data.type);
        } catch (error) {
            console.error(`[WalletService] Error processing withdraw for user ${data.userId}:`, error);
        }
    }

    async deposit(userId: string, amount: number) {
        const wallet = await this.walletModel.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { returnDocument: 'after' },
        );

        await this.amqpConnection.publish('fintech.topic', 'wallet.deposit.completed', {
            userId,
            amount,
            type: LedgerOperationType.DEPOSIT,
            direction: 'credit'
        });

        return wallet;
    }

    async transfer(fromUserId: string, toUserId: string, amount: number) {
        if (amount <= 0)
            throw new Error('Invalid transfer amount');

        const fromWallet = await this.walletModel.findOne({ userId: fromUserId });
        const toWallet = await this.walletModel.findOne({ userId: toUserId });

        if (!fromWallet || !toWallet)
            throw new Error('Wallet not found');

        if (fromWallet.balance < amount)
            throw new Error('Insufficient balance');

        fromWallet.balance -= amount;
        toWallet.balance += amount;

        await fromWallet.save();
        await toWallet.save();

        await this.registerLedgerEntry(fromUserId, amount, LedgerOperationType.TRANSFER, 'debit');
        await this.registerLedgerEntry(toUserId, amount, LedgerOperationType.TRANSFER, 'credit');

        return {
            fromUserId,
            toUserId,
            amount,
        };
    }

    async withdraw(userId: string, amount: number, type: LedgerOperationType) {
        const wallet = await this.walletModel.findOneAndUpdate(
            { userId },
            { $inc: { balance: -amount } },
            { returnDocument: 'after' },
        );

        await this.registerLedgerEntry(userId, amount, type, 'debit');

        return wallet;
    }

    private async registerLedgerEntry(userId: string, amount: number, type: LedgerOperationType, direction: string): Promise<void> {
        const services = JSON.parse(
            this.configService.getOrThrow<string>('SERVICES'),
        ) as Record<string, string>;

        await serviceCall(services, {
            service: 'ledger',
            method: 'POST',
            path: '/ledger/transaction',
            data: { userId, amount, type, direction },
        });
    }
}
