import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('')
    createPayment(
        @Body() body: {
            type: string;
            issuerId: string;
            payerId?: string;
            amount: number;
            dueDate?: string;
        },
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
    getPendingPayments() {
        return this.paymentService.getPendingPayments();
    }

    @Get('transaction/:txId')
    getByTxId(@Param('txId') txId: string) {
        return this.paymentService.getPaymentByTxId(txId);
    }

    @Post('webhook')
    confirmPix(@Body() body: { txId: string }) {
        return this.paymentService.confirmPayment(body.txId);
    }

    @Post('reissue')
    reissue(
        @Body()
        body: { txId: string; newDueDate: string },
    ) {
        return this.paymentService.reissueBoleto(
            body.txId,
            body.newDueDate,
        );
    }

    @Post('capture')
    capture(@Body() body: { txId: string }) {
        return this.paymentService.capture(body.txId);
    }

    @Post('refund')
    refund(@Body() body: { txId: string }) {
        return this.paymentService.refund(body.txId);
    }

    @Post('chargeback')
    chargeback(@Body() body: { txId: string }) {
        return this.paymentService.chargeback(body.txId);
    }
}
