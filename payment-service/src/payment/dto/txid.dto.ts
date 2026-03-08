import { ApiProperty } from '@nestjs/swagger';

export class TxIdDto {
    @ApiProperty({ description: 'The ID of the transaction', example: 'BOLETO-xxxxxxxxxxxxx' })
    txId: string;
}
