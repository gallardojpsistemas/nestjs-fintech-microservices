import { ApiProperty } from '@nestjs/swagger';

export class CardTxIdDto {
    @ApiProperty({ description: 'The ID of the card transaction', example: 'CARD-xxxxxxxxxxxxx' })
    txId: string;
}
