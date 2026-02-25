import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class LedgerService {
    constructor(
        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,
    ) { }

    async createTransaction(data: CreateTransactionDto) {
        return this.transactionModel.create(data);
    }
}
