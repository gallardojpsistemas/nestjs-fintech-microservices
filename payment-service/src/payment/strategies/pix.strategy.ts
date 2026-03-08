import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PaymentStrategy } from './payment.strategy';

@Injectable()
export class PixStrategy implements PaymentStrategy {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
    ) { }

    async createPayment(issuerId: string, amount: number, payerId?: string) {
        const txId = `PIX-${Date.now()}`;

        const payment = await this.paymentModel.create({
            issuerId,
            payerId,
            amount,
            type: 'pix',
            status: 'pending',
            txId,
        });

        return {
            txId,
            status: payment.status,
        };
    }
}