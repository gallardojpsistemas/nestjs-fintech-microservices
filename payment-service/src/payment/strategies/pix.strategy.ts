import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PaymentStrategy } from './payment.strategy';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';

@Injectable()
export class PixStrategy implements PaymentStrategy {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
        private readonly amqpConnection: AmqpConnection,
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
            pixKey: issuerId,
        });

        if (payerId) {
            await this.amqpConnection.publish('fintech.topic', 'wallet.withdraw', {
                userId: payerId,
                amount,
                type: LedgerOperationType.WITHDRAW,
            });
        }

        // Simulate Delay
        setTimeout(async () => {
            try {
                await this.amqpConnection.publish('fintech.topic', 'payment.pix.webhook', { txId });
                console.log(`[PixStrategy] Simulated webhook event published for PIX payment: ${txId}`);
            } catch (error) {
                console.error(`[PixStrategy] Failed to publish simulated webhook event for PIX payment ${txId}:`, error);
            }
        }, 20000);

        return {
            txId,
            status: payment.status,
        };
    }
}