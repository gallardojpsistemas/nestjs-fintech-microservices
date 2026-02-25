import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    type: string; // pix

    @Prop({ default: 'pending' })
    status: string; // pending | paid | expired | reissued

    @Prop({ required: true, unique: true })
    txId: string; // simulated PIX transaction id

    @Prop()
    dueDate?: Date;

    @Prop()
    originalTxId?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);