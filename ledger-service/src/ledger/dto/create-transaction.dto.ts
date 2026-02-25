export class CreateTransactionDto {
    fromUserId: string;
    toUserId: string;
    amount: number;
    type: string;
}