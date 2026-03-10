import { ApiProperty } from "@nestjs/swagger";

export class CreatePixChargeDto {
    @ApiProperty({
        description: 'The ID of the issuer',
        example: '69adc7eb615ac14170f0be8e'
    })
    issuerId: string;

    @ApiProperty({
        description: 'The amount to be charged',
        example: 25.00
    })
    amount: number;
}