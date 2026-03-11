import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { ConfigService } from '@nestjs/config';
import { PixStrategy } from './strategies/pix.strategy';
import { BoletoStrategy } from './strategies/boleto.strategy';
import { CreditCardStrategy } from './strategies/credit-card.strategy';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { generatePixQr } from 'src/common/pix/pix-qrcode.util';

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

    async getPaymentByTxId(txId: string) {
        return await this.paymentModel.findOne({ txId }).exec();
    }
    async confirmPayment(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new NotFoundException('Payment not found');

        if (payment.status === PaymentStatus.PAID) {
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
                payment.status = PaymentStatus.EXPIRED;
                await payment.save();

                return {
                    message: 'Boleto expired',
                    txId,
                };
            }
        }

        if (payment.type === 'pix') {
            await this.amqpConnection.publish('fintech.topic', 'payment.pix.webhook', { txId });
            return {
                message: 'Pix Webhook processing started',
                txId,
            };
        }

        payment.status = PaymentStatus.PAID;
        await payment.save();

        return {
            message: 'Payment confirmed',
            txId,
        };
    }

    /* Boleto */
    async getUserBoletos(userId: string) {
        return await this.paymentModel.find({ issuerId: userId, type: 'boleto' }).sort({ createdAt: -1 }).exec();
    }

    async payBoleto(txId: string, payerId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new NotFoundException('Payment not found');

        if (payment.type !== 'boleto')
            throw new BadRequestException('Only boletos can be paid with this endpoint');

        if (payment.status === PaymentStatus.PAID)
            throw new BadRequestException('Boleto already paid');

        if (payment.status === PaymentStatus.EXPIRED)
            throw new BadRequestException('Boleto is expired');

        if (payment.dueDate) {
            const now = new Date();
            const endOfDayDueDate = new Date(payment.dueDate);
            endOfDayDueDate.setUTCHours(23, 59, 59, 999);

            if (now > endOfDayDueDate) {
                payment.status = PaymentStatus.EXPIRED;
                await payment.save();
                throw new BadRequestException('Boleto is expired');
            }
        }

        // 1. Withdraw from payer's wallet
        await this.amqpConnection.publish('fintech.topic', 'wallet.withdraw', {
            userId: payerId,
            amount: payment.amount,
            // Using WITHDRAW since PAYMENT is not in LedgerOperationType
            type: LedgerOperationType.WITHDRAW,
        });

        // 2. We set the payerId on the boleto to keep track of who paid it
        payment.payerId = payerId;
        await payment.save();

        return {
            message: 'Boleto paid successfully',
            txId,
        };
    }

    async settlePayment(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new NotFoundException('Payment not found');

        if (payment.status === 'settled') {
            return {
                message: 'Already settled',
                txId,
            };
        }

        if (payment.status !== PaymentStatus.PAID) {
            throw new BadRequestException('Boleto must be paid before settlement');
        }

        if (payment.type !== 'boleto') {
            throw new BadRequestException('Only boleto settlements are supported this way');
        }

        payment.status = PaymentStatus.SETTLED;
        await payment.save();

        await this.amqpConnection.publish('fintech.topic', 'wallet.deposit', {
            userId: payment.issuerId,
            amount: payment.amount,
        });

        return {
            message: 'Boleto settled successfully',
            txId,
        };
    }

    async reissueBoleto(txId: string, newDueDate: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new NotFoundException('Payment not found')

        if (payment.type !== 'boleto')
            throw new BadRequestException('Only boleto can be reissued');

        if (payment.status !== PaymentStatus.EXPIRED && payment.status !== 'pending')
            throw new BadRequestException('Only pending or expired boletos can be reissued');

        if (payment.status === 'pending') {
            if (!payment.dueDate) throw new BadRequestException('Boleto has no due date');
            const now = new Date();
            const endOfDayDueDate = new Date(payment.dueDate);
            endOfDayDueDate.setUTCHours(23, 59, 59, 999);

            if (now <= endOfDayDueDate) {
                throw new BadRequestException('Only expired boletos or past due boletos can be reissued');
            }
            payment.status = PaymentStatus.EXPIRED;
            await payment.save();
        }

        const { fine, interest, updatedAmount, daysLate } = this.calculateBoletoPenalty(
            payment.amount,
            payment.dueDate as Date,
        );

        payment.status = PaymentStatus.REISSUED;
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

    /* Pix */
    async createPixCharge(issuerId: string, amount: number) {
        const txId = `PIX-${Date.now()}`;

        const payment = await this.paymentModel.create({
            issuerId,
            amount,
            type: 'pix',
            status: 'pending',
            txId,
            pixKey: issuerId,
        });

        const { payload, qrCode } = await generatePixQr(
            issuerId,
            'FINTECH DEMO',
            'ARARANGUA',
            amount,
            txId,
        )

        return {
            txId,
            amount,
            pixKey: issuerId,
            payload,
            qrCode,
            status: payment.status,
        };
    }

    async createPixTransfer(payerId: string, pixKey: string, amount: number) {
        const txId = `PIX-${Date.now()}`;

        const payment = await this.paymentModel.create({
            issuerId: pixKey, // receiver
            payerId,
            pixKey,
            amount,
            type: 'pix',
            status: 'pending',
            txId,
        });

        await this.amqpConnection.publish(
            'fintech.topic',
            'wallet.withdraw',
            {
                userId: payerId,
                amount,
                type: LedgerOperationType.WITHDRAW,
            },
        );

        // Simulate Delay
        setTimeout(async () => {
            await this.amqpConnection.publish(
                'fintech.topic',
                'payment.pix.webhook',
                { txId }
            );
            console.log(`[PIX] webhook simulated for ${txId}`);
        }, 30000);

        return {
            txId,
            status: payment.status,
        };
    }

    @RabbitSubscribe({
        exchange: 'fintech.topic',
        routingKey: 'payment.pix.webhook',
        queue: 'payment_pix_webhook_queue',
    })
    async handlePixWebhookListener(data: { txId: string }) {
        console.log(`[PIX webhook] received for ${data.txId}`);
        try {
            const payment = await this.paymentModel.findOne({ txId: data.txId });

            if (!payment)
                throw new NotFoundException('Payment not found');

            if (payment.status === PaymentStatus.PAID) {
                console.log(`[PIX] already processed ${data.txId}`);
                return;
            };

            payment.status = PaymentStatus.PAID;
            await payment.save();

            await this.amqpConnection.publish('fintech.topic', 'wallet.deposit', {
                userId: payment.issuerId,
                amount: payment.amount
            });

            console.log(`[PIX] payment completed ${payment.txId}`);
        } catch (error) {
            console.error(`[PIX webhook error]`, error);
        }
    }

    /* Credit Card */
    async capture(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new NotFoundException('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can be captured');

        if (payment.status !== PaymentStatus.AUTHORIZED)
            throw new Error('Payment not authorized');

        payment.status = PaymentStatus.PAID;
        await payment.save();

        await this.depositToWallet(payment.issuerId, payment.amount);

        return {
            message: 'Payment captured',
            txId,
        };
    }

    async refund(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new NotFoundException('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can be refunded');

        if (payment.status !== PaymentStatus.PAID)
            throw new Error('Only paid payments can be refunded');

        payment.status = PaymentStatus.REFUNDED;
        await payment.save();

        await this.withdrawFromWallet(payment);

        return {
            message: 'Payment refunded',
            txId,
        };
    }

    async chargeback(txId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment) throw new NotFoundException('Payment not found');

        if (payment.type !== 'credit_card')
            throw new Error('Only credit card payments can have chargeback');

        if (payment.status !== PaymentStatus.PAID)
            throw new Error('Only paid payments can be charged back');

        payment.status = PaymentStatus.CHARGEBACK;
        await payment.save();

        await this.withdrawFromWallet(payment);

        return {
            message: 'Chargeback processed',
            txId,
        };
    }

    /* Simulate */
    async simulatePixPayment(txId: string, payerId: string) {
        const payment = await this.paymentModel.findOne({ txId });

        if (!payment)
            throw new NotFoundException('Payment not found');

        if (payment.status !== 'pending')
            throw new BadRequestException('Payment already processed');

        payment.payerId = payerId;
        await payment.save();

        if (payment.issuerId !== payerId) {
            await this.amqpConnection.publish(
                'fintech.topic',
                'wallet.withdraw',
                {
                    userId: payerId,
                    amount: payment.amount,
                    type: LedgerOperationType.WITHDRAW,
                },
            );
        };

        // Webhook Simulando
        setTimeout(async () => {
            await this.amqpConnection.publish(
                'fintech.topic',
                'payment.pix.webhook',
                { txId },
            );
        }, 30000);

        return {
            message: 'PIX payment initiated',
            txId,
        };
    }

    /* Helper methods */
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
}
