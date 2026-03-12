import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PaymentStrategy } from './payment.strategy';
import { CardToken, CardTokenDocument } from '../schemas/card-token.schema';

@Injectable()
export class CreditCardStrategy implements PaymentStrategy {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
        @InjectModel(CardToken.name)
        private cardTokenModel: Model<CardTokenDocument>,
    ) { }

    async createPayment(issuerId: string, amount: number, payerId?: string, cardToken?: string, cvv?: string) {
        if (!cardToken || !cvv)
            throw new Error('Card token and CVV are required for credit card payments');

        const card = await this.cardTokenModel.findOne({ token: cardToken });

        if (!card)
            throw new Error('Invalid card token');

        if (card.userId !== payerId)
            throw new Error('Card does not belong to this user');

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