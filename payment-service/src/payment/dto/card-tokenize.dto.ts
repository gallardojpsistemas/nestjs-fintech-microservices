import { ApiProperty } from '@nestjs/swagger';

export class TokenizeCardDto {
    @ApiProperty({ example: '4242424242424242' })
    cardNumber: string;

    @ApiProperty({ example: 'Juan Gallardo' })
    cardHolder: string;

    @ApiProperty({ example: '12' })
    expiryMonth: string;

    @ApiProperty({ example: '2026' })
    expiryYear: string;
}