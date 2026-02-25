import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('')
    createPayment(
        @Body() body: {
            type: string;
            userId: string;
            amount: number;
            dueDate?: string;
        },
    ) {
        return this.paymentService.createPayment(
            body.type,
            body.userId,
            body.amount,
            body.dueDate,
        );
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
}
