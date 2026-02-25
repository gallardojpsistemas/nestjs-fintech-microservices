import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PaymentStrategy } from './payment.strategy';

@Injectable()
export class BoletoStrategy implements PaymentStrategy {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
    ) { }

    async createPayment(
        userId: string,
        amount: number,
        dueDate: string,
    ) {
        const parsedDate = new Date(dueDate);

        if (Number.isNaN(parsedDate.getTime()))
            throw new BadRequestException('Invalid due date');

        const txId = `BOLETO-${Date.now()}`;

        const payment = await this.paymentModel.create({
            userId,
            amount,
            type: 'boleto',
            status: 'pending',
            txId,
            dueDate: parsedDate,
        });

        return {
            txId,
            status: payment.status,
            dueDate: payment.dueDate,
        };
    }
}