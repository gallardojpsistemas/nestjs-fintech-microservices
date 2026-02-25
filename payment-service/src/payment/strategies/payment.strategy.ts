export interface PaymentStrategy {
    createPayment(userId: string, amount: number): Promise<any>;
}