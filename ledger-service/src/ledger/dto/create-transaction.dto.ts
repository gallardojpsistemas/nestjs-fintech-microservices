import { LedgerOperationType } from "src/common/enums/ledger-operation-type.enum";

export class CreateTransactionDto {
    userId: string;
    amount: number;
    type: LedgerOperationType;
    direction: 'credit' | 'debit';
    referenceId?: string; // txId opcional
}