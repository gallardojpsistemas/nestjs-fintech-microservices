import { Controller } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { WalletService } from './wallet.service'

@Controller()
export class WalletEventsController {

    constructor(private readonly walletService: WalletService) { }

    @EventPattern('user.created')
    async handleUserCreated(@Payload() data: any) {
        const payload = data?.data ?? data
        const { userId } = payload;

        console.log('user.created event received:', userId)

        await this.walletService.createWallet(userId)
    }
}