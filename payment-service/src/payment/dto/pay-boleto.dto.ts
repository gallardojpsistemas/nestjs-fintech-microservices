import { ApiProperty } from '@nestjs/swagger';

export class PayBoletoDto {
    @ApiProperty({ description: 'The ID of the transaction (boleto) to pay', example: 'BOLETO-1772997472652' })
    txId: string;

    @ApiProperty({ description: 'The ID of the user paying the boleto', example: '69adc803615ac14170f0be93' })
    userId: string;
}
