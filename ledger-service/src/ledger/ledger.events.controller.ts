import { Controller } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { LedgerService } from './ledger.service'

@Controller()
export class LedgerEventsController {

    constructor(private readonly ledgerService: LedgerService) { }

    @EventPattern('wallet.deposit.completed')
    async handleDeposit(@Payload() data: any) {
        const payload = data?.data ?? data
        const { userId, amount, type, direction } = payload

        console.log('deposit event received', payload)

        await this.ledgerService.createTransaction({
            userId,
            amount,
            type,
            direction
        })
    }
}