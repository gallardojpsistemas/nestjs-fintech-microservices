import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class LedgerService {
    constructor(
        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,
    ) { }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'wallet.deposit.completed',
        queue: 'ledger_wallet_queue',
    })
    async handleDeposit(data: any) {
        const payload = data?.data ?? data;
        const { userId, amount, type, direction, metadata } = payload;

        console.log('deposit event received in service:', payload);

        await this.createTransaction({
            userId,
            amount,
            type,
            direction,
            metadata
        });
    }

    async createTransaction(data: CreateTransactionDto) {
        return this.transactionModel.create(data);
    }

    async getHistory(userId: string) {
        return this.transactionModel.find({
            $or: [{ userId }, { targetUserId: userId }]
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .exec();
    }
}
