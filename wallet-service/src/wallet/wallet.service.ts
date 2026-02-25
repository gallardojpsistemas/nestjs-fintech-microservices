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
}
