import { ApiProperty } from "@nestjs/swagger";

export class PayPixDto {
    @ApiProperty({ description: 'The ID of the transaction', example: 'PIX-xxxxxxxxxxxxx' })
    txId: string;

    @ApiProperty({ description: 'The ID of the payer', example: '69adc803615ac14170f0be93' })
    payerId: string;
}