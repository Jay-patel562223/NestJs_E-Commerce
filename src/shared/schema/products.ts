import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum categoryType {
  operatingSystem = 'operating system',
  applicationSoftware = 'application software',
}

export enum platformType {
  windows = 'windows',
  mac = 'mac',
  linux = 'linux',
  android = 'android',
  ios = 'ios',
}

export enum baseType {
  computer = 'computer',
  mobile = 'mobile',
}

@Schema({ timestamps: true })
export class Feedbackers extends mongoose.Document {
  @Prop({})
  customerId: string;

  @Prop({})
  customerName: string;

  @Prop({})
  rating: number;

  @Prop({})
  feedbackMsg: string;
}
export const FeedbackSchema = SchemaFactory.createForClass(Feedbackers);

@Schema({ timestamps: true })
export class SkuDetails extends mongoose.Document {
  @Prop({})
  skuName: string;

  @Prop({})
  price: number;

  @Prop({})
  validity: number; // in days

  @Prop({})
  lifetime: boolean;

  @Prop({})
  stripePriceId: string;

  @Prop({})
  skuCode?: string;
}
export const skuDetailsSchema = SchemaFactory.createForClass(SkuDetails);

@Schema({ timestamps: true })
export class Products {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    default:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/2048px-No_image_available.svg.png',
  })
  image?: string;

  @Prop({ required: true, enum: categoryType })
  category: string;

  @Prop({ required: true, enum: platformType })
  platformType: string;

  @Prop({ required: true, enum: baseType })
  baseType: string;

  @Prop({ required: true })
  productUrl: string;

  @Prop({ required: true })
  downloadUrl: string;

  @Prop({})
  avgRating: number;

  @Prop([{ type: FeedbackSchema }])
  feedbackDetails: Feedbackers[];

  @Prop([{ type: skuDetailsSchema }])
  skuDetails: SkuDetails[];

  @Prop({ type: Object })
  imageDetails: Record<string, any>;

  @Prop({})
  requirementSpecification: Record<string, any>[];

  @Prop({})
  highlights: string[];

  @Prop({})
  stripeProductId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Products);
