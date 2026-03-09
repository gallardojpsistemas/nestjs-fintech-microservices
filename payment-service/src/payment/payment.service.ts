import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { serviceCall } from 'src/common/service-call-util';
import { ConfigService } from '@nestjs/config';
import { PixStrategy } from './strategies/pix.strategy';
import { BoletoStrategy } from './strategies/boleto.strategy';
import { CreditCardStrategy } from './strategies/credit-card.strategy';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class PaymentService {
    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
        private readonly configService: ConfigService,
        private readonly pixStrategy: PixStrategy,
        private readonly boletoStrategy: BoletoStrategy,
        private readonly creditCardStrategy: CreditCardStrategy,
        private readonly amqpConnection: AmqpConnection,
    ) { }

    async createPayment(
        type: string,
        issuerId: string,
        amount: number,
        dueDate?: string,
        payerId?: string,
    ) {
        switch (type) {
            case 'pix':
                return this.pixStrategy.createPayment(issuerId, amount, payerId);

            case 'boleto':
                return this.boletoStrategy.createPayment(issuerId, amount, dueDate!, payerId);

            case 'credit_card':
                return this.creditCardStrategy.createPayment(issuerId, amount, payerId);

            default:
                throw new BadRequestException('Invalid payment type');
        }
    }

    async getPendingPayments() {
        return await this.paymentModel.find({ status: 'pending' }).exec();
    }

    async getUserBoletos(userId: string) {
        return await this.paymentModel.find({ issuerId: userId, type: 'boleto' }).sort({ createdAt: -1 }).exec();
    }

    async getPaymentByTxId(txId: string) {
        return await this.paymentModel.findOne({ txId }).exec();
    }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'payment.pix.webhook',
        queue: 'payment_pix_webhook_queue',
    })
    async handlePixWebhookListener(data: { txId: string }) {
        console.log(`[PaymentService] Received simulated PIX webhook for txId: ${data.txId}`);
        try {
            const result = await this.confirmPayment(data.txId);
            console.log(`[PaymentService] Webhook confirmation result:`, result);
        } catch (error) {
            console.error(`[PaymentService] Error processing PIX webhook for ${data.txId}:`, error);
        }
    }

    async confirmPayment(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new Error('Payment not found');

        if (payment.status === 'paid') {
            return {
                message: 'Already processed',
                txId,
            };
        }

        if (payment.type === 'boleto' && payment.dueDate) {
            const now = new Date();

            // Allow payment until the end of the day of the dueDate
            const endOfDayDueDate = new Date(payment.dueDate);
            endOfDayDueDate.setUTCHours(23, 59, 59, 999);

            if (now > endOfDayDueDate) {
                payment.status = 'expired';
                await payment.save();

                return {
                    message: 'Boleto expired',
                    txId,
                };
            }
        }

        payment.status = 'paid';
        await payment.save();

        await this.depositToWallet(payment.issuerId, payment.amount);

        return {
            message: 'Payment confirmed',
            txId,
        };
    }

    async reissueBoleto(txId: string, newDueDate: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new Error('Payment not found');

        if (payment.type !== 'boleto')
            throw new Error('Only boleto can be reissued');

        if (payment.status !== 'expired' && payment.status !== 'pending')
            throw new Error('Only pending or expired boletos can be reissued');

        if (payment.status === 'pending') {
            if (!payment.dueDate) throw new Error('Boleto has no due date');
            const now = new Date();
            const endOfDayDueDate = new Date(payment.dueDate);
            endOfDayDueDate.setUTCHours(23, 59, 59, 999);

            if (now <= endOfDayDueDate) {
                throw new Error('Only expired boletos or past due boletos can be reissued');
            }
            payment.status = 'expired';
            await payment.save();
        }

        const { fine, interest, updatedAmount, daysLate } = this.calculateBoletoPenalty(
            payment.amount,
            payment.dueDate as Date,
        );

        payment.status = 'reissued';
        await payment.save();

        const newTxId = `BOLETO-${Date.now()}`;

        await this.paymentModel.create({
            issuerId: payment.issuerId,
            payerId: payment.payerId,
            amount: updatedAmount,
            type: 'boleto',
            status: 'pending',
            txId: newTxId,
            dueDate: new Date(),
            originalTxId: payment.txId,
        });

        return {
            oldTxId: payment.txId,
            newTxId,
            newDueDate: new Date().toISOString(),
            originalAmount: payment.amount,
            fine,
            interest,
            updatedAmount,
            daysLate,
        };
    }

    async capture(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new Error('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can be captured');

        if (payment.status !== 'authorized')
            throw new Error('Payment not authorized');

        payment.status = 'paid';
        await payment.save();

        await this.depositToWallet(payment.issuerId, payment.amount);

        return {
            message: 'Payment captured',
            txId,
        };
    }

    async refund(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new Error('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can be refunded');

        if (payment.status !== 'paid')
            throw new Error('Only paid payments can be refunded');

        payment.status = 'refunded';
        await payment.save();

        await this.withdrawFromWallet(payment);

        return {
            message: 'Payment refunded',
            txId,
        };
    }

    async chargeback(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new Error('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can have chargeback');

        if (payment.status !== 'paid')
            throw new Error('Only paid payments can be charged back');

        payment.status = LedgerOperationType.CHARGEBACK;
        await payment.save();

        await this.withdrawFromWallet(payment);

        return {
            message: 'Chargeback processed',
            txId,
        };
    }

    private async depositToWallet(userId: string, amount: number) {
        await this.amqpConnection.publish('fintech.topic', 'wallet.deposit', {
            userId,
            amount,
        });
    }

    private calculateBoletoPenalty(amount: number, dueDate: Date) {
        const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
        const now = new Date();

        const diffTime = now.getTime() - dueDate.getTime();
        const daysLate = Math.ceil(diffTime / ONE_DAY_IN_MS);

        let fine = 0;
        let interest = 0;

        if (daysLate > 0) {
            const fineRate = 0.02; // 2%
            const monthlyInterestRate = 0.01; // 1% per month
            const dailyInterestRate = monthlyInterestRate / 30;

            fine = amount * fineRate;
            interest = amount * dailyInterestRate * daysLate;
        }

        const updatedAmount = Number(
            (amount + fine + interest).toFixed(2)
        );

        return {
            fine: Number(fine.toFixed(2)),
            interest: Number(interest.toFixed(2)),
            updatedAmount,
            daysLate: Math.max(0, daysLate),
        };
    }

    private async withdrawFromWallet(payment: PaymentDocument) {
        await this.amqpConnection.publish('fintech.topic', 'wallet.withdraw', {
            userId: payment.issuerId,
            amount: payment.amount,
            type: LedgerOperationType.REFUND,
        });
    }
    async payBoleto(txId: string, userId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new BadRequestException('Payment not found');
        if (payment.type !== 'boleto') throw new BadRequestException('Only boletos can be paid this way');
        if (payment.status === 'paid' || payment.status === 'processing') throw new BadRequestException('Boleto already paid or processing');
        if (payment.status === 'expired') throw new BadRequestException('Boleto is expired');

        if (payment.dueDate) {
            const now = new Date();
            const endOfDayDueDate = new Date(payment.dueDate);
            endOfDayDueDate.setUTCHours(23, 59, 59, 999);

            if (now > endOfDayDueDate) {
                payment.status = 'expired';
                await payment.save();
                throw new BadRequestException('Boleto is expired');
            }
        }

        await this.amqpConnection.publish('fintech.topic', 'wallet.withdraw', {
            userId,
            amount: payment.amount,
            type: LedgerOperationType.WITHDRAW,
        });

        return {
            message: 'Boleto paid successfully from user wallet',
            txId,
        };
    }
}
