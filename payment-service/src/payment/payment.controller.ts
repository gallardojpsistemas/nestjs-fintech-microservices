import { Body, Controller, Post, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CardTxIdDto } from './dto/card-txid.dto';
import { WebhookTxIdDto } from './dto/webhook-txid.dto';
import { ReissueBoletoDto } from './dto/reissue-boleto.dto';
import { PayBoletoDto } from './dto/pay-boleto.dto';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('')
    @ApiTags('Transactions')
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiBody({
        type: CreatePaymentDto,
        examples: {
            pix: {
                summary: 'Pix Payment',
                description: 'A Pix payment. Notice that dueDate is omitted for Pix.',
                value: {
                    type: 'pix',
                    issuerId: '69adc7eb615ac14170f0be8e',
                    amount: 50.00
                }
            },
            boleto: {
                summary: 'Boleto Payment',
                description: 'A Boleto payment including a dueDate and payerId.',
                value: {
                    type: 'boleto',
                    issuerId: '69adc7eb615ac14170f0be8e',
                    payerId: '69adc803615ac14170f0be93',
                    amount: 100.00,
                    dueDate: '2026-12-31T23:59:59.000Z'
                }
            },
            credit_card: {
                summary: 'Credit Card Payment',
                description: 'A Credit Card payment without a dueDate.',
                value: {
                    type: 'credit_card',
                    issuerId: '69adc7eb615ac14170f0be8e',
                    amount: 150.00
                }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Payment successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    createPayment(
        @Body() body: CreatePaymentDto,
    ) {
        return this.paymentService.createPayment(
            body.type,
            body.issuerId,
            body.amount,
            body.dueDate,
            body.payerId,
        );
    }

    @Get('transaction/pending')
    @ApiTags('Transactions')
    @ApiOperation({ summary: 'Get all pending payments' })
    @ApiResponse({ status: 200, description: 'List of pending payments.' })
    getPendingPayments() {
        return this.paymentService.getPendingPayments();
    }

    @Get('boleto/user/:userId')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Get boletos by user ID' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 200, description: 'List of user boletos.' })
    getUserBoletos(@Param('userId') userId: string) {
        return this.paymentService.getUserBoletos(userId);
    }

    @Get('transaction/:txId')
    @ApiTags('Transactions')
    @ApiOperation({ summary: 'Get payment by transaction ID' })
    @ApiParam({ name: 'txId', description: 'Transaction ID', example: 'BOLETO-1772997472652' })
    @ApiResponse({ status: 200, description: 'Payment details.' })
    @ApiResponse({ status: 404, description: 'Payment not found.' })
    async getByTxId(@Param('txId') txId: string) {
        const payment = await this.paymentService.getPaymentByTxId(txId);
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }

    @Post('webhook')
    @ApiTags('Webhooks')
    @ApiOperation({ summary: 'Confirm a payment via webhook (e.g. Boleto or Pix)' })
    @ApiBody({ type: WebhookTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment confirmed.' })
    confirmPayment(@Body() body: WebhookTxIdDto) {
        return this.paymentService.confirmPayment(body.txId);
    }

    @Post('boleto/pay')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Pay a boleto (simulates backend orchestration)' })
    @ApiBody({ type: PayBoletoDto })
    @ApiResponse({ status: 201, description: 'Boleto paid successfully.' })
    payBoleto(@Body() body: PayBoletoDto) {
        return this.paymentService.payBoleto(body.txId, body.payerId);
    }

    @Post('boleto/reissue')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Reissue an expired boleto' })
    @ApiBody({ type: ReissueBoletoDto })
    @ApiResponse({ status: 201, description: 'Boleto reissued.' })
    reissue(
        @Body()
        body: ReissueBoletoDto,
    ) {
        return this.paymentService.reissueBoleto(
            body.txId,
            body.newDueDate,
        );
    }

    @Post('card/capture')
    @ApiTags('Credit Cards')
    @ApiOperation({ summary: 'Capture a credit card payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment captured.' })
    capture(@Body() body: CardTxIdDto) {
        return this.paymentService.capture(body.txId);
    }

    @Post('card/refund')
    @ApiTags('Credit Cards')
    @ApiOperation({ summary: 'Refund a payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment refunded.' })
    refund(@Body() body: CardTxIdDto) {
        return this.paymentService.refund(body.txId);
    }

    @Post('card/chargeback')
    @ApiTags('Credit Cards')
    @ApiOperation({ summary: 'Chargeback a payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment charged back.' })
    chargeback(@Body() body: CardTxIdDto) {
        return this.paymentService.chargeback(body.txId);
    }
}
