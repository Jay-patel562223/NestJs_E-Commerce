import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { checkoutDto, checkoutDtoArr } from './dto/checkout.dto';
import { STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { OrderRepository } from 'src/shared/repositories/order.repository';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { LicenseRepository } from 'src/shared/repositories/license.repository';
import { userTypes } from 'src/shared/schema/users';
import { Orders, orderStatus, paymentStatus } from 'src/shared/schema/orders';

interface Data{
  lifetime: boolean,
  price: number,
  productId: string,
  productImage: string,
  productName: string,
  skuCode: string,
  validity: number,
  quantity: number,
  skuPriceId: string
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
    @Inject(OrderRepository) private readonly orderDB: OrderRepository,
    @Inject(ProductRepository) private readonly productDB: ProductRepository,
    @Inject(LicenseRepository) private readonly licenseDB: LicenseRepository,
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}
  async checkout(
    body: checkoutDtoArr,
    user: Record<string, any>,
  ): Promise<{
    message: string;
    success: boolean;
    result: string;
  }> {
    try {
      const lineItems: Array<any> = [];
      const cartItems: checkoutDto[] = body.checkoutDetails;
      for (const item of cartItems) {
        const itemsAreInStock = await this.licenseDB.find({
          productSku: item.skuId,
          isSold: false,
        });
        if (
          itemsAreInStock.length !== 0 &&
          itemsAreInStock.length >= item.quantity
        ) {
          lineItems.push({
            price: item.skupriceId,
            quantity: item.quantity,
            adjustable_quantity: {
              enabled: true,
              maximum: 5,
              minimum: 1,
            },
          });
        }
      }

      if (lineItems.length === 0) {
        throw new BadRequestException(
          'These products are not available right now',
        );
      }

      const session = await this.stripeClient.checkout.sessions.create({
        line_items: lineItems,
        metadata: {
          userId: user._id.toString(),
        },
        mode: 'payment',
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        customer_email: user.email,
        success_url: process.env.STRIPE_SUCCESSURL,
        cancel_url: process.env.STRIPE_CANCELURL,
      });

      return {
        message: 'Payment checkout session successfully created',
        success: true,
        result: session.url,
      };
    } catch (error) {
      throw error;
    }
  }

  async create(order: Record<string, any>) {
    try {
      const orderExist = await this.orderDB.findOne({
        checkoutSessionId: order.checkoutSessionId,
      });
      if (orderExist) {
        return orderExist;
      }

      const createOrder = await this.orderDB.create(order);
      return createOrder;
    } catch (error) {
      throw error;
    }
  }

  async webhook(rawBody: Buffer, sig: string) {
    try {
      let event: any;
      try {
        event = this.stripeClient.webhooks.constructEvent(
          rawBody,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        throw new BadRequestException('Webhook Error:', err.message);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderData = await this.createOrderObject(session);
        const order = await this.create(orderData);
        if (session.payment_status == paymentStatus.paid) {
          if (order.orderStatus !== orderStatus.completed) {
            for (const item of order.orderedItems) {
              const licenses = await this.getLicense(orderData.orderId, item);
              item.licenseKeys = licenses;
            }
          }
          await this.orderDB.findOneAndUpdate(
            { checkoutSessionId: session.id },
            {
              orderStatus: orderStatus.completed,
              isOrderDelivered: true,
              ...orderData,
            },
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getLicense(orderId: string, item: Record<string, any>) {
    try {
      const product = await this.productDB.findOne({
        _id: item.productId,
      });

      const skuDetails = product.skuDetails.find(
        (sku) => sku.skuCode == item.skuCode,
      );

      const licenses = await this.licenseDB.findWithLimit(
        {
          productSku: skuDetails._id,
          isSold: false,
        },
        item.quantity,
      );
      const licenseIds = licenses.map((license) => license._id);

      await this.licenseDB.updateMany(
        {
          _id: {
            $in: licenseIds,
          },
        },
        {
          isSold: true,
          orderId: orderId,
        },
      );
      return licenses.map((license) => license.licenseKey);
    } catch (error) {
      throw error;
    }
  }

  async createOrderObject(session: Stripe.Checkout.Session) {
    try {
      const lineItems = await this.stripeClient.checkout.sessions.listLineItems(
        session.id,
      );
      const orderData = {
        orderId: Math.floor(new Date().valueOf() * Math.random()) + '',
        user: session.metadata?.userId,
        customerAddress: session.customer_details?.address,
        customerEmail: session.customer_details.email,
        customerPhoneNumber: session.customer_details.phone,
        totalAmount: session.amount_total / 100,
        paymentInfo: {
          paymentMethod: session.payment_method_types[0],
          paymentIntentId: session.payment_intent,
          paymentDate: new Date(),
          paymentAmount: session.amount_total / 100,
          paymentStatus: session.payment_status,
        },
        orderDate: new Date(),
        checkoutSessionId: session.id,
        orderedItems: lineItems.data.map((item) => {
          const data: Data = {
            lifetime: String(item.price.metadata.lifetime).toLowerCase() === "true",
            price: Number(item.price.metadata.price),
            productId: item.price.metadata.productId,
            productImage:item.price.metadata.productImage,
            productName: item.price.metadata.productName,
            skuCode: item.price.metadata.skuCode,
            validity: Number(item.price.metadata.validity),
            quantity: Number(item.quantity),
            skuPriceId: item.price.id,
          };
          return data;
        }),
      };
      return orderData;
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    status: string,
    user: Record<string, any>,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const userdetails = await this.userDB.findById(user._id);
      const query = {} as Record<string, any>;
      if (userdetails.type === userTypes.CUSTOMER) {
        query.user = user._id.toString();
      }
      if (status) {
        query.orderStatus = status;
      }
      const orders = await this.orderDB.find(query);
      return {
        message: 'Orders fetched successfully',
        success: true,
        result: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<{
    message: string;
    success: boolean;
    result: Orders;
  }> {
    try {
      const order = await this.orderDB.findOne({ _id: id });
      return {
        message: 'Order fetched successfully',
        success: true,
        result: order,
      };
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
