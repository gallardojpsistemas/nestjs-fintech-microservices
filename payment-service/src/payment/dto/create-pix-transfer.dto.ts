import { ApiProperty } from '@nestjs/swagger';

export class CreatePixTransferDto {
    @ApiProperty({
        description: 'The ID of the user who is paying the Pix',
        example: '69adc7eb615ac14170f0be8e'
    })
    payerId: string;

    @ApiProperty({
        description: 'The Pix key of the user who is receiving the Pix',
        example: '69adc803615ac14170f0be93'
    })
    pixKey: string;

    @ApiProperty({
        description: 'The amount to be transferred',
        example: 25.00
    })
    amount: number;
}