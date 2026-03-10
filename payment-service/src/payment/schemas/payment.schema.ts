import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentType {
    PIX = 'pix',
    BOLETO = 'boleto',
    CREDIT_CARD = 'credit_card',
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
    type: string; // pix | boleto | credit_card

    @Prop({ default: 'pending' })
    status: string; // pending | paid | settled | expired | reissued | chargeback

    @Prop({ required: true, unique: true })
    txId: string; // simulated PIX transaction id

    @Prop()
    dueDate?: Date;

    @Prop()
    originalTxId?: string;

    @Prop()
    pixKey?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);