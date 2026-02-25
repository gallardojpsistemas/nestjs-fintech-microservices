import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PixStrategy } from './strategies/pix.strategy';
import { BoletoStrategy } from './strategies/boleto.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema }
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PixStrategy,
    BoletoStrategy,
  ]
})
export class PaymentModule { }
