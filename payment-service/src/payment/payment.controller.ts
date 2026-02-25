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
        },
    ) {
        return this.paymentService.createPayment(
            body.type,
            body.userId,
            body.amount,
        );
    }

    @Post('webhook/pix')
    confirmPix(@Body() body: { txId: string }) {
        return this.paymentService.confirmPix(body.txId);
    }
}
