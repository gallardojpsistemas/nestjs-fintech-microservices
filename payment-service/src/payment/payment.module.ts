import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PixStrategy } from './strategies/pix.strategy';
import { BoletoStrategy } from './strategies/boleto.strategy';
import { CreditCardStrategy } from './strategies/credit-card.strategy';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { CardToken, CardTokenSchema } from './schemas/card-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: CardToken.name, schema: CardTokenSchema },
    ]),
    RabbitMQModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PixStrategy,
    BoletoStrategy,
    CreditCardStrategy,
    CardToken,
  ]
})
export class PaymentModule { }
