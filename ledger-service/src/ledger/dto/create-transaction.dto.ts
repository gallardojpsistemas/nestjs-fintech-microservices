import { LedgerOperationType } from "src/common/enums/ledger-operation-type.enum";

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
    @ApiProperty({ description: 'The ID of the user', example: '69adc7eb615ac14170f0be8e' })
    userId: string;

    @ApiProperty({ description: 'The transaction amount', example: 100 })
    amount: number;

    @ApiProperty({ enum: LedgerOperationType, description: 'Type of ledger operation', example: LedgerOperationType.DEPOSIT })
    type: LedgerOperationType;

    @ApiProperty({ description: 'Direction of the transaction', enum: ['credit', 'debit'], example: 'credit' })
    direction: 'credit' | 'debit';

    @ApiPropertyOptional({ description: 'Optional reference ID (e.g., txId from payment service)', example: 'tx-98765' })
    referenceId?: string; // txId opcional
}