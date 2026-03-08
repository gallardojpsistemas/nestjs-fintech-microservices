import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
    @ApiProperty({ description: 'The ID of the user sending the funds', example: '69adc803615ac14170f0be93' })
    fromUserId: string;

    @ApiProperty({ description: 'The ID of the user receiving the funds', example: '69adc7eb615ac14170f0be8e' })
    toUserId: string;

    @ApiProperty({ description: 'The amount to transfer', example: 50.00 })
    amount: number;
}