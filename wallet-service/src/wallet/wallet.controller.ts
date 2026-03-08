import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TransferDto } from './dto/transfer.dto';
import { AmountDto } from './dto/amount.dto';
import { LedgerOperationType } from 'src/common/enums/ledger-operation-type.enum';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('transfer')
    @ApiOperation({ summary: 'Transfer funds between wallets' })
    @ApiBody({ type: TransferDto })
    @ApiResponse({ status: 201, description: 'Transfer successful.' })
    @ApiResponse({ status: 400, description: 'Insufficient funds or bad request.' })
    transfer(@Body() body: TransferDto) {
        return this.walletService.transfer(
            body.fromUserId,
            body.toUserId,
            body.amount,
        );
    }

    @Post(':userId')
    @ApiOperation({ summary: 'Create a new wallet for a user' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 201, description: 'Wallet created successfully.' })
    create(@Param('userId') userId: string) {
        return this.walletService.createWallet(userId);
    }

    @Get(':userId')
    @ApiOperation({ summary: 'Get wallet data (balance) for a user' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiResponse({ status: 200, description: 'Returns wallet balance data.' })
    @ApiResponse({ status: 404, description: 'Wallet not found.' })
    get(@Param('userId') userId: string) {
        return this.walletService.getWallet(userId);
    }

    @Post(':userId/deposit')
    @ApiOperation({ summary: 'Deposit funds into a wallet' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiBody({ type: AmountDto })
    @ApiResponse({ status: 201, description: 'Deposit successful.' })
    deposit(
        @Param('userId') userId: string,
        @Body() body: AmountDto,
    ) {
        return this.walletService.deposit(userId, body.amount);
    }

    @Post(':userId/withdraw')
    @ApiOperation({ summary: 'Withdraw funds from a wallet' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiBody({ type: AmountDto })
    @ApiResponse({ status: 201, description: 'Withdrawal successful.' })
    @ApiResponse({ status: 400, description: 'Insufficient funds.' })
    withdraw(
        @Param('userId') userId: string,
        @Body() body: AmountDto,
    ) {
        return this.walletService.withdraw(userId, body.amount, LedgerOperationType.WITHDRAW);
    }

    @Post(':userId/chargeback')
    @ApiOperation({ summary: 'Chargeback funds from a wallet' })
    @ApiParam({ name: 'userId', description: 'User ID', example: '69adc7eb615ac14170f0be8e' })
    @ApiBody({ type: AmountDto })
    @ApiResponse({ status: 201, description: 'Chargeback successful.' })
    @ApiResponse({ status: 400, description: 'Insufficient funds.' })
    chargeback(
        @Param('userId') userId: string,
        @Body() body: AmountDto,
    ) {
        return this.walletService.withdraw(userId, body.amount, LedgerOperationType.CHARGEBACK);
    }
}
