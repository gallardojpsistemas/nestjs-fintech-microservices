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

    async createPayment(issuerId: string, amount: number, payerId?: string, cardToken?: string, cvv?: string) {
        if (!cardToken || !cvv)
            throw new Error('Card token and CVV are required for credit card payments');

        const txId = `CARD-${Date.now()}`;

        const payment = await this.paymentModel.create({
            issuerId,
            payerId,
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