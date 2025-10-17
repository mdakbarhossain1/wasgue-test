# 🚀 Stripe Setup - Quick Start Guide

## ❌ Current Issue
Je ziet de error: **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"**

Dit betekent dat Stripe nog niet is geconfigureerd met je API keys.

## ✅ Oplossing (5 minuten)

### Stap 1: Maak een Stripe Test Account
1. Ga naar [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Maak een gratis account aan
3. Je bent automatisch in "Test mode" - perfect voor development!

### Stap 2: Haal je API Keys op
1. Ga naar [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Kopieer je **Publishable key** (begint met `pk_test_`)
3. Kopieer je **Secret key** (begint met `sk_test_`)

### Stap 3: Maak .env.local bestand
In de `web/` directory, maak een nieuw bestand: `.env.local`

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_jouw_secret_key_hier
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_jouw_publishable_key_hier
STRIPE_WEBHOOK_SECRET=whsec_placeholder_for_now
```

### Stap 4: Herstart Development Server
```bash
# Stop de server (Ctrl+C)
# Start opnieuw
npm run dev
```

### Stap 5: Test de Payment Flow
1. Ga naar checkout
2. Vul form in
3. Klik "Afrekenen met iDEAL"
4. Je zou nu een werkende Stripe payment form moeten zien!

## 🧪 Test Cards voor Development

### Succesvolle Betaling
- **Kaart**: 4242 4242 4242 4242
- **Vervaldatum**: Elke datum in de toekomst
- **CVC**: Elke 3 cijfers

### iDEAL Test
- Selecteer een willekeurige test bank
- Alle iDEAL test betalingen slagen automatisch

### Gefaalde Betaling (voor testing)
- **Kaart**: 4000 0000 0000 0002

## 🔧 Webhook Setup (Later)
Voor nu kun je testen zonder webhooks. Voor productie heb je webhooks nodig om automatisch orders aan te maken in WooCommerce.

## ❓ Hulp Nodig?

### Veelvoorkomende Problemen

#### "Invalid API Key"
- Controleer of je de juiste keys hebt gekopieerd
- Zorg ervoor dat je test keys gebruikt (beginnen met `sk_test_` en `pk_test_`)

#### "Payment Form Laadt Niet"
- Controleer of `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` correct is ingesteld
- Herstart de development server

#### "JSON Error Blijft"
- Controleer of `.env.local` in de juiste directory staat (`web/.env.local`)
- Controleer of de variable names exact kloppen (hoofdlettergevoelig)

### Support
- **Stripe Documentatie**: [https://stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## 🎯 Resultaat
Na deze setup:
- ✅ Payment form werkt
- ✅ Test betalingen mogelijk  
- ✅ Error messages verdwenen
- ✅ Ready voor verdere development

**Tijd nodig: ~5 minuten** ⏱️

