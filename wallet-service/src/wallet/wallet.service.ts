import { Injectable } from '@nestjs/common';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { serviceCall } from 'src/common/service-call-util';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';

@Injectable()
export class WalletService {
    constructor(
        @InjectModel(Wallet.name)
        private readonly walletModel: Model<WalletDocument>,
        private readonly configService: ConfigService,
    ) { }

    async createWallet(userId: string) {
        return this.walletModel.create({ userId });
    }

    async getWallet(userId: string) {
        return this.walletModel.findOne({ userId });
    }

    async deposit(userId: string, amount: number) {
        const wallet = await this.walletModel.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { returnDocument: 'after' },
        );

        await this.registerLedgerEntry(userId, amount, LedgerOperationType.DEPOSIT, 'credit');

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
