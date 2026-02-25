import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('transfer')
    transfer(@Body() body: TransferDto) {
        return this.walletService.transfer(
            body.fromUserId,
            body.toUserId,
            body.amount,
        );
    }

    @Post(':userId')
    create(@Param('userId') userId: string) {
        return this.walletService.createWallet(userId);
    }

    @Get(':userId')
    get(@Param('userId') userId: string) {
        return this.walletService.getWallet(userId);
    }

    @Post(':userId/deposit')
    deposit(
        @Param('userId') userId: string,
        @Body('amount') amount: number,
    ) {
        return this.walletService.deposit(userId, amount);
    }
}
