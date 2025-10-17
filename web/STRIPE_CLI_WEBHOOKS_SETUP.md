# 🎣 Stripe CLI Webhooks - Setup Complete!

## ✅ Status
- **Stripe CLI**: Geïnstalleerd en gekoppeld ✅
- **Webhook Forwarding**: Actief naar `localhost:3000/api/stripe/webhook` ✅

## 🔑 Webhook Secret Ophalen

De Stripe CLI heeft automatisch een webhook secret gegenereerd. Je kunt deze op 2 manieren vinden:

### Methode 1: Check de CLI Output
Kijk in de terminal waar `stripe listen` draait. Je zou iets als dit moeten zien:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

### Methode 2: Nieuwe Terminal + Listen
Open een nieuwe terminal en run:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-secret
```

## 📝 Update .env.local

Vervang de placeholder webhook secret in je `.env.local`:

```bash
# Vervang deze regel:
STRIPE_WEBHOOK_SECRET=whsec_placeholder_for_development

# Met de echte secret (van de CLI output):
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## 🧪 Test de Webhook Flow

### Stap 1: Herstart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Stap 2: Test Payment
1. Ga naar checkout
2. Vul form in
3. Betaal met test card: `4242 4242 4242 4242`
4. **Let op**: Nu wordt de order op 2 manieren aangemaakt:
   - **Direct API call** (onze huidige implementatie)
   - **Webhook** (nieuwe Stripe CLI forwarding)

### Stap 3: Monitor Webhooks
In de terminal met `stripe listen` zie je real-time webhook events:
```
2023-09-22 12:30:15   --> payment_intent.succeeded [evt_1ABC...]
2023-09-22 12:30:15  <--  [200] POST http://localhost:3000/api/stripe/webhook
```

## 🔧 Handige CLI Commando's

### Webhook Management
```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# View webhook events
stripe logs tail

# Test specific event
stripe trigger payment_intent.succeeded
```

### Payment Testing
```bash
# Create test payment
stripe payment_intents create \
  --amount=2000 \
  --currency=eur \
  --payment-method-types=card \
  --payment-method-types=ideal

# List recent payments
stripe payment_intents list --limit=5
```

### Development Helpers
```bash
# View account info
stripe config --list

# Switch between test/live mode
stripe config --set test_mode_api_key sk_test_...
```

## 🎯 Voordelen van Webhook Integration

### Development
- **Real-time testing** van webhook flows
- **Duplicate order detection** (webhook + direct API)
- **Production-like environment** lokaal

### Production Ready
- **Automatic order creation** via webhooks
- **Reliable payment processing** 
- **Failover mechanisms** (direct + webhook)

## ⚠️ Belangrijk

### Dubbele Orders Voorkomen
Momenteel hebben we beide systemen:
1. **Direct API** (success page)
2. **Webhook** (Stripe CLI)

Dit kan dubbele orders veroorzaken. Voor productie kiezen we:
- **Webhooks** voor live omgeving
- **Direct API** als fallback

### Webhook Secret Security
- **Nooit** de webhook secret committen
- **Test keys** alleen voor development
- **Live webhook secrets** alleen voor productie

## 🚀 Next Steps

1. **Update .env.local** met webhook secret
2. **Herstart development server**
3. **Test complete flow** met beide systemen
4. **Kies productie strategie** (webhooks vs direct API)

**Je hebt nu een professionele development setup met real-time webhook testing!** 🎉

