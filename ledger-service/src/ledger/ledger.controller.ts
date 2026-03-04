import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('ledger')
export class LedgerController {
    constructor(private ledgerService: LedgerService) { }

    @Post('transaction')
    create(@Body() body: CreateTransactionDto) {
        return this.ledgerService.createTransaction(body);
    }

    @Get('history/:userId')
    async getHistory(@Param('userId') userId: string) {
        return this.ledgerService.getHistory(userId);
    }
}
