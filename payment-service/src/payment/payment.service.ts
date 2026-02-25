import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { serviceCall } from 'src/common/service-call-util';
import { ConfigService } from '@nestjs/config';
import { PixStrategy } from './strategies/pix.strategy';
import { BoletoStrategy } from './strategies/boleto.strategy';

@Injectable()
export class PaymentService {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
        private readonly configService: ConfigService,
        private readonly pixStrategy: PixStrategy,
        private readonly boletoStrategy: BoletoStrategy,
    ) { }

    async createPayment(
        type: string,
        userId: string,
        amount: number,
        dueDate?: string,
    ) {
        switch (type) {
            case 'pix':
                return this.pixStrategy.createPayment(userId, amount);

            case 'boleto':
                return this.boletoStrategy.createPayment(userId, amount, dueDate!);

            default:
                throw new BadRequestException('Invalid payment type');
        }
    }

    async confirmPix(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new Error('Payment not found');

        if (payment.status === 'paid') {
            return {
                message: 'Already processed',
                txId,
            };
        }

        payment.status = 'paid';
        await payment.save();

        await this.depositToWallet(payment.userId, payment.amount);

        return {
            message: 'PIX confirmed',
            txId,
        };
    }

    private async depositToWallet(userId: string, amount: number) {
        const services = JSON.parse(
            this.configService.getOrThrow<string>('SERVICES'),
        ) as Record<string, string>;

        await serviceCall(services, {
            service: 'wallet',
            method: 'POST',
            path: `/wallet/${userId}/deposit`,
            data: { amount },
        });
    }
}
