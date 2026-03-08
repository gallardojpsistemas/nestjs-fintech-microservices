import { ApiProperty } from '@nestjs/swagger';

export class PixTxIdDto {
    @ApiProperty({ description: 'The ID of the PIX transaction', example: 'PIX-xxxxxxxxxxxxx' })
    txId: string;
}
