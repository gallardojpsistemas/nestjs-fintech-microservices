export interface PaymentStrategy {
    createPayment(userId: string, amount: number, dueDate?: string): Promise<any>;
}