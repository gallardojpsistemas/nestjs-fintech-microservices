export class CreateTransactionDto {
    userId: string;
    amount: number;
    type: string; // transfer | deposit | refund | etc
    direction: 'credit' | 'debit';
    referenceId?: string; // txId opcional
}