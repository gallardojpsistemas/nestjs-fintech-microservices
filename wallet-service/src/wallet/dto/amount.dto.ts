import { ApiProperty } from '@nestjs/swagger';

export class AmountDto {
    @ApiProperty({ description: 'The transaction amount', example: 150.75 })
    amount: number;
}
