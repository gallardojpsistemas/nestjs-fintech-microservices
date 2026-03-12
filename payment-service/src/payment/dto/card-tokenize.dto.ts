import { ApiProperty } from '@nestjs/swagger';

export class TokenizeCardDto {
    @ApiProperty({ example: '69adc7eb615ac14170f0be8e' })
    userId: string;

    @ApiProperty({ example: '4242424242424242' })
    cardNumber: string;

    @ApiProperty({ example: 'Juan Gallardo' })
    cardHolder: string;

    @ApiProperty({ example: '12' })
    expiryMonth: string;

    @ApiProperty({ example: '2026' })
    expiryYear: string;
}