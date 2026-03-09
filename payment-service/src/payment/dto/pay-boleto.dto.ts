import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayBoletoDto {
    @ApiProperty({
        description: 'The transaction ID of the Boleto to pay',
        example: 'BOLETO-xxxxxxxxxxxxx',
    })
    @IsString()
    @IsNotEmpty()
    txId: string;

    @ApiProperty({
        description: 'The ID of the user who is paying the Boleto',
        example: '69adc7eb615ac14170f0be8e',
    })
    @IsString()
    @IsNotEmpty()
    payerId: string;
}
