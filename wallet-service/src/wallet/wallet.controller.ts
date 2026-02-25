import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

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
