import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ required: true })
    fromUserId: string;

    @Prop({ required: true })
    toUserId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    type: string; // transfer | deposit | pix etc

    @Prop({ default: 'completed' })
    status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);