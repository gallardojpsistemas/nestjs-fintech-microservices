import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { LedgerEventsController } from './ledger.events.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    RabbitMQModule
  ],
  providers: [LedgerService],
  controllers: [LedgerController, LedgerEventsController]
})
export class LedgerModule { }
