import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum paymentStatus {
  pending = 'pending',
  paid = 'paid',
  failed = 'failed',
}

export enum orderStatus {
  pending = 'pending',
  completed = 'completed',
}

export class OrderedItems {
  @Prop({ required: true })
  ProductName: string;

  @Prop({ required: true })
  ProductId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  skuCode: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  lifetime: boolean;

  @Prop({ required: true })
  validity: number;

  @Prop({ required: true })
  skuPriceId: string;

  @Prop({ default: [] })
  licenseKeys: string[];
}

@Schema({ timestamps: true })
export class Orders {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, type: mongoose.Schema.ObjectId, ref: 'Users' })
  user: string;

  @Prop({ required: true, type: Object })
  customerAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };

  @Prop({ required: true })
  customerPhoneNumber: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  orderedItems: OrderedItems[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, type: Object })
  paymentInfo: {
    paymentMethod: string;
    paymentStatus: paymentStatus;
    paymentAmount: number;
    paymentDate: Date;
    paymentIntentId: string;
  };

  @Prop({ default: orderStatus.pending, enum: orderStatus })
  orderStatus: orderStatus;

  @Prop({ default: false })
  isOrderDelivered: boolean;

  @Prop({ default: null })
  checkoutSessionId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Orders);
