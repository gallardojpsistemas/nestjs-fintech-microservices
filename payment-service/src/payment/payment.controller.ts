import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CardTxIdDto } from './dto/card-txid.dto';
import { PixTxIdDto } from './dto/pix-txid.dto';
import { ReissueBoletoDto } from './dto/reissue-boleto.dto';
import { PayBoletoDto } from './dto/pay-boleto.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('')
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiBody({ type: CreatePaymentDto })
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

    @Get('pending')
    @ApiOperation({ summary: 'Get all pending payments' })
    @ApiResponse({ status: 200, description: 'List of pending payments.' })
    getPendingPayments() {
        return this.paymentService.getPendingPayments();
    }

    @Get('user/:userId/boletos')
    @ApiOperation({ summary: 'Get boletos by user ID' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 200, description: 'List of user boletos.' })
    getUserBoletos(@Param('userId') userId: string) {
        return this.paymentService.getUserBoletos(userId);
    }

    @Get('transaction/:txId')
    @ApiOperation({ summary: 'Get payment by transaction ID' })
    @ApiParam({ name: 'txId', description: 'Transaction ID', example: 'BOLETO-1772997472652' })
    @ApiResponse({ status: 200, description: 'Payment details.' })
    @ApiResponse({ status: 404, description: 'Payment not found.' })
    getByTxId(@Param('txId') txId: string) {
        return this.paymentService.getPaymentByTxId(txId);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Confirm Pix payment via webhook' })
    @ApiBody({ type: PixTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment confirmed.' })
    confirmPix(@Body() body: PixTxIdDto) {
        return this.paymentService.confirmPayment(body.txId);
    }

    @Post('reissue')
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

    @Post('capture')
    @ApiOperation({ summary: 'Capture a credit card payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment captured.' })
    capture(@Body() body: CardTxIdDto) {
        return this.paymentService.capture(body.txId);
    }

    @Post('refund')
    @ApiOperation({ summary: 'Refund a payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment refunded.' })
    refund(@Body() body: CardTxIdDto) {
        return this.paymentService.refund(body.txId);
    }

    @Post('chargeback')
    @ApiOperation({ summary: 'Chargeback a payment' })
    @ApiBody({ type: CardTxIdDto })
    @ApiResponse({ status: 201, description: 'Payment charged back.' })
    chargeback(@Body() body: CardTxIdDto) {
        return this.paymentService.chargeback(body.txId);
    }

    @Post('pay-boleto')
    @ApiOperation({ summary: 'Simulate paying a boleto' })
    @ApiBody({ type: PayBoletoDto })
    @ApiResponse({ status: 201, description: 'Boleto paid.' })
    payBoleto(@Body() body: PayBoletoDto) {
        return this.paymentService.payBoleto(body.txId, body.userId);
    }
}
