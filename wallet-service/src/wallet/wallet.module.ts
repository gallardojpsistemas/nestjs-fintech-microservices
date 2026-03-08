import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { WalletEventsController } from './wallet.events.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
    ]),
    RabbitMQModule,
  ],
  providers: [WalletService],
  controllers: [WalletController, WalletEventsController]
})
export class WalletModule { }
