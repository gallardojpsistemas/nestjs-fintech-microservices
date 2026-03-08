import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({ description: 'The payment method type (e.g., pix, boleto, credit_card)', example: 'pix' })
    type: string;

    @ApiProperty({ description: 'The ID of the issuer (e.g., user requesting the payment)', example: '69adc7eb615ac14170f0be8e' })
    issuerId: string;

    @ApiPropertyOptional({ description: 'The ID of the payer, if applicable', example: '69adc803615ac14170f0be93' })
    payerId?: string;

    @ApiProperty({ description: 'The payment amount', example: 50.00 })
    amount: number;

    @ApiPropertyOptional({ description: 'The due date for boleto payments', example: '2026-12-31T23:59:59.000Z' })
    dueDate?: string;
}
