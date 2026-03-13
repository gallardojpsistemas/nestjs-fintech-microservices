import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    direction: string;

    @Prop()
    referenceId?: string;

    @Prop({ type: Object })
    metadata?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);