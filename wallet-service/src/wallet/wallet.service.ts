import { Injectable } from '@nestjs/common';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class WalletService {
    constructor(
        @InjectModel(Wallet.name)
        private readonly walletModel: Model<WalletDocument>,
    ) { }

    async createWallet(userId: string) {
        return this.walletModel.create({ userId });
    }

    async getWallet(userId: string) {
        return this.walletModel.findOne({ userId });
    }

    async deposit(userId: string, amount: number) {
        return this.walletModel.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { new: true },
        );
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

        return {
            fromUserId,
            toUserId,
            amount,
        };
    }
}
