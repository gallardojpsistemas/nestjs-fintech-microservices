import { ApiProperty } from '@nestjs/swagger';

export class WebhookTxIdDto {
    @ApiProperty({ description: 'The transaction ID', example: 'BOLETO-xxxxxxxxxxxxx' })
    txId: string;
}
