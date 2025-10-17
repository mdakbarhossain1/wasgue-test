import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
function initializeStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === 'sk_test_placeholder_for_development') {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

// WooCommerce credentials
const WC_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wcHeaders() {
  const token = Buffer.from(`${CK}:${CS}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, orderId, amount, reason } = await request.json() as {
      paymentIntentId: string;
      orderId?: number;
      amount?: number; // Optional partial refund amount in cents
      reason?: string;
    };

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is verplicht' },
        { status: 400 }
      );
    }

    const stripe = initializeStripe();

    // Get the payment intent to find the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      return NextResponse.json(
        { error: 'Geen charge gevonden voor deze payment intent' },
        { status: 400 }
      );
    }

    // Create refund
    const refundParams: Stripe.RefundCreateParams = {
      charge: paymentIntent.latest_charge as string,
      reason: reason || 'requested_by_customer',
      metadata: {
        woocommerce_order_id: orderId?.toString() || '',
        refund_requested_at: new Date().toISOString(),
      },
    };

    // Add amount if partial refund
    if (amount && amount > 0) {
      refundParams.amount = amount;
    }

    console.log('Creating Stripe refund:', refundParams);

    const refund = await stripe.refunds.create(refundParams);

    console.log('Stripe refund created successfully:', refund.id);

    // Update WooCommerce order status if order ID provided
    if (orderId) {
      try {
        const orderUpdateData = {
          status: refund.amount === paymentIntent.amount ? 'refunded' : 'partially-refunded',
          meta_data: [
            {
              key: '_stripe_refund_id',
              value: refund.id,
            },
            {
              key: '_refund_amount',
              value: (refund.amount / 100).toString(),
            },
            {
              key: '_refund_created_at',
              value: new Date().toISOString(),
            },
          ],
        };

        const wcResponse = await fetch(`${WC_API_URL}/orders/${orderId}`, {
          method: 'PUT',
          headers: wcHeaders(),
          body: JSON.stringify(orderUpdateData),
        });

        if (wcResponse.ok) {
          console.log('WooCommerce order status updated to refunded');
        } else {
          console.error('Failed to update WooCommerce order status:', wcResponse.status);
        }
      } catch (wcError) {
        console.error('Error updating WooCommerce order:', wcError);
        // Don't fail the refund if WooCommerce update fails
      }
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      created: refund.created,
      message: `Refund van €${(refund.amount / 100).toFixed(2)} succesvol verwerkt`,
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Stripe refund fout',
          details: error.message,
          type: error.type,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verwerken van de refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve refund information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');
    const refundId = searchParams.get('refund_id');

    if (!paymentIntentId && !refundId) {
      return NextResponse.json(
        { error: 'Payment Intent ID of Refund ID is verplicht' },
        { status: 400 }
      );
    }

    const stripe = initializeStripe();

    if (refundId) {
      // Get specific refund
      const refund = await stripe.refunds.retrieve(refundId);
      return NextResponse.json({
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          created: refund.created,
        },
      });
    }

    if (paymentIntentId) {
      // Get all refunds for payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.latest_charge) {
        return NextResponse.json({ refunds: [] });
      }

      const refunds = await stripe.refunds.list({
        charge: paymentIntent.latest_charge as string,
        limit: 10,
      });

      return NextResponse.json({
        refunds: refunds.data.map(refund => ({
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          created: refund.created,
        })),
      });
    }

  } catch (error) {
    console.error('Error retrieving refund information:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van refund informatie' },
      { status: 500 }
    );
  }
}

