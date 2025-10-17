# Stripe Environment Variables Setup

## Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Stripe Configuration
# Get these keys from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Stripe Webhook Secret
# Create a webhook endpoint in Stripe Dashboard pointing to: your-domain.com/api/stripe/webhook
# Events to listen for: payment_intent.succeeded, payment_intent.payment_failed
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Setup Instructions

### 1. Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 2. Create Webhook Endpoint
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select events: `payment_intent.succeeded` and `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 3. Enable Payment Methods
Go to [Stripe Payment Methods](https://dashboard.stripe.com/settings/payment-methods) and enable:
- **iDEAL** (for Dutch customers)
- **Bancontact** (for Belgian customers)
- **Cards** (Visa, Mastercard, etc.)

### 4. Local Development
For local testing with webhooks, use Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will provide a webhook signing secret for local development.

### 5. Production Setup
- Use live keys (`sk_live_` and `pk_live_`) for production
- Ensure webhook endpoint is publicly accessible
- Update webhook URL to your production domain

## Security Notes
- Never commit `.env.local` to version control
- Keep secret keys secure and rotate them regularly
- Use test keys for development, live keys only for production
- Validate webhook signatures to prevent spoofing

## Testing
You can test the payment flow with Stripe test cards:
- **Successful payment**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined payment**: 4000 0000 0000 0002

For iDEAL testing, use any test bank in the Stripe test environment.
