import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Ledger')
@Controller('ledger')
export class LedgerController {
    constructor(private ledgerService: LedgerService) { }

    @Post('transaction')
    @ApiOperation({ summary: 'Create a new ledger transaction' })
    @ApiBody({ type: CreateTransactionDto })
    @ApiResponse({ status: 201, description: 'Transaction successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    create(@Body() body: CreateTransactionDto) {
        return this.ledgerService.createTransaction(body);
    }

    @Get('history/:userId')
    @ApiOperation({ summary: 'Get transaction history for a user' })
    @ApiParam({ name: 'userId', description: 'The ID of the user', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 200, description: 'Return the transaction history.' })
    async getHistory(@Param('userId') userId: string) {
        return this.ledgerService.getHistory(userId);
    }
}
