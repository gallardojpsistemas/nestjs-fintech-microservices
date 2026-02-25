import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('pix')
    createPix(@Body() body: { userId: string; amount: number }) {
        return this.paymentService.createPix(body.userId, body.amount);
    }

    @Post('webhook/pix')
    confirmPix(@Body() body: { txId: string }) {
        return this.paymentService.confirmPix(body.txId);
    }
}
