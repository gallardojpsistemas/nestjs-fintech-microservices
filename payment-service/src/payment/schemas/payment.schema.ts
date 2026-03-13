import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentType {
    PIX = 'pix',
    BOLETO = 'boleto',
    CREDIT_CARD = 'credit_card',
}

export enum PaymentStatus {
    PENDING = 'pending',
    AUTHORIZED = 'authorized',
    PAID = 'paid',
    SETTLED = 'settled',
    EXPIRED = 'expired',
    REISSUED = 'reissued',
    REFUNDED = 'refunded',
    CHARGEBACK = 'chargeback',
}

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true })
    issuerId: string;

    @Prop()
    payerId?: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    type: PaymentType;

    @Prop({ default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Prop({ required: true, unique: true })
    txId: string;

    @Prop()
    dueDate?: Date;

    @Prop()
    originalTxId?: string;

    @Prop()
    pixKey?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);