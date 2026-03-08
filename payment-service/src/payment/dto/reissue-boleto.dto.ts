import { ApiProperty } from '@nestjs/swagger';

export class ReissueBoletoDto {
    @ApiProperty({ description: 'The ID of the transaction (boleto) to reissue', example: 'BOLETO-xxxxxxxxxxxxx' })
    txId: string;

    @ApiProperty({ description: 'The new due date for the reissued boleto', example: '2026-12-31T23:59:59.000Z' })
    newDueDate: string;
}
