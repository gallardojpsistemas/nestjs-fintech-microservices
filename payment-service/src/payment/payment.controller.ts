import { Body, Controller, Post, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CardTxIdDto } from './dto/card-txid.dto';
import { WebhookTxIdDto } from './dto/webhook-txid.dto';
import { ReissueBoletoDto } from './dto/reissue-boleto.dto';
import { PayBoletoDto } from './dto/pay-boleto.dto';
import { CreatePixTransferDto } from './dto/create-pix-transfer.dto';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PayPixDto } from './dto/pay-pix.dto';
import { TokenizeCardDto } from './dto/card-tokenize.dto';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('')
    @ApiTags('Transactions')
    @ApiOperation({ summary: 'Create a new payment (e.g. Boleto, Pix or Credit Card)' })
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
                    amount: 150.00,
                    payerId: '69adc803615ac14170f0be93',
                    cardToken: '3afd7ef6-1eef-410b-8aad-069d14569225',
                    cvv: '123'
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
            body.cardToken,
            body.cvv
        );
    }

    @Get('transaction/pending')
    @ApiTags('Transactions')
    @ApiOperation({ summary: 'Get all pending payments' })
    @ApiResponse({ status: 200, description: 'List of pending payments.' })
    getPendingPayments() {
        return this.paymentService.getPendingPayments();
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

    @Get('boleto/user/:userId')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Get boletos by user ID' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 200, description: 'List of user boletos.' })
    getUserBoletos(@Param('userId') userId: string) {
        return this.paymentService.getUserBoletos(userId);
    }

    @Post('boleto/pay')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Pay a boleto (simulates backend orchestration)' })
    @ApiBody({ type: PayBoletoDto })
    @ApiResponse({ status: 201, description: 'Boleto paid successfully.' })
    payBoleto(@Body() body: PayBoletoDto) {
        return this.paymentService.payBoleto(body.txId, body.payerId);
    }

    @Post('boleto/settle')
    @ApiTags('Boletos')
    @ApiOperation({ summary: 'Settle a paid boleto (changes status to settled)' })
    @ApiBody({ type: WebhookTxIdDto })
    @ApiResponse({ status: 201, description: 'Boleto settled successfully.' })
    settleBoleto(@Body() body: WebhookTxIdDto) {
        return this.paymentService.settlePayment(body.txId);
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

    @Post('pix/charge')
    @ApiTags('Pix')
    @ApiOperation({ summary: 'Create a PIX charge (cobrança)' })
    createPixCharge(
        @Body() body: CreatePixChargeDto) {
        return this.paymentService.createPixCharge(
            body.issuerId,
            body.amount,
        );
    }

    @Post('pix/transfer')
    @ApiTags('Pix')
    @ApiOperation({ summary: 'Execute PIX transfer using pix key' })
    createPixTransfer(
        @Body() body: CreatePixTransferDto
    ) {
        return this.paymentService.createPixTransfer(
            body.payerId,
            body.pixKey,
            body.amount
        );
    }

    @Post('card/tokenize')
    @ApiTags('Credit Cards')
    @ApiOperation({ summary: 'Tokenize a credit card' })
    @ApiBody({ type: TokenizeCardDto })
    @ApiResponse({ status: 201, description: 'Card tokenized successfully.' })
    tokenizeCard(@Body() body: TokenizeCardDto) {
        return this.paymentService.tokenize(
            body.userId,
            body.cardNumber,
            body.cardHolder,
            body.expiryMonth,
            body.expiryYear,
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

    @Post('simulate/pix/pay')
    @ApiTags('Pix')
    @ApiOperation({ summary: 'Simulate PIX payment' })
    payPix(
        @Body() body: PayPixDto) {
        return this.paymentService.simulatePixPayment(
            body.txId,
            body.payerId,
        );
    }

    @Post('webhook')
    @ApiTags('Webhooks')
    @ApiOperation({ summary: 'Confirm a payment via webhook (e.g. Boleto or Pix)' })
    @ApiBody({ type: WebhookTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment confirmed.' })
    confirmPayment(@Body() body: WebhookTxIdDto) {
        return this.paymentService.confirmPayment(body.txId);
    }
}
