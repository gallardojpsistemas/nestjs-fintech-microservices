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
    status: string; // pending | paid | failed

    @Prop({ required: true, unique: true })
    txId: string; // simulated PIX transaction id

    @Prop()
    dueDate?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);