import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PaymentStrategy } from './payment.strategy';

@Injectable()
export class CreditCardStrategy implements PaymentStrategy {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
    ) { }

    async createPayment(userId: string, amount: number) {
        const txId = `CARD-${Date.now()}`;

        const payment = await this.paymentModel.create({
            userId,
            amount,
            type: 'credit_card',
            status: 'authorized',
            txId,
        });

        return {
            txId,
            status: payment.status,
        };
    }
}