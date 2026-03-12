import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CardTokenDocument = CardToken & Document;

@Schema({ timestamps: true })
export class CardToken {
    @Prop({ required: true, unique: true })
    token: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    brand: string;

    @Prop({ required: true })
    last4: string;

    @Prop({ required: true })
    holder: string;

    @Prop({ required: true })
    expiryMonth: string;

    @Prop({ required: true })
    expiryYear: string;
}

export const CardTokenSchema = SchemaFactory.createForClass(CardToken);