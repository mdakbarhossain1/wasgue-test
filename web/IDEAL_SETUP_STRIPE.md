# 🏦 iDEAL Setup in Stripe Dashboard

## Probleem
Je ziet alleen creditcards, geen iDEAL optie.

## ✅ Oplossing: Activeer iDEAL in Stripe Dashboard

### Stap 1: Ga naar Payment Methods
1. **Login** in je Stripe Dashboard
2. **Ga naar:** [https://dashboard.stripe.com/test/settings/payment-methods](https://dashboard.stripe.com/test/settings/payment-methods)

### Stap 2: Activeer iDEAL
1. **Zoek naar "iDEAL"** in de lijst
2. **Klik op "Enable"** naast iDEAL
3. **Accepteer de terms** als gevraagd

### Stap 3: Activeer Bancontact (optioneel)
1. **Zoek naar "Bancontact"** in de lijst
2. **Klik op "Enable"** naast Bancontact
3. Voor Belgische klanten

### Stap 4: Controleer Land Settings
1. **Ga naar:** [https://dashboard.stripe.com/test/settings/account](https://dashboard.stripe.com/test/settings/account)
2. **Controleer** dat "Netherlands" is toegevoegd als land
3. **Voeg toe** als dit er niet staat

## 🔄 Na Activatie

### Server Herstarten
```bash
# Stop development server (Ctrl+C)
npm run dev
```

### Test de Payment Flow
1. Ga naar checkout
2. Klik "Afrekenen met iDEAL"
3. Je zou nu **3 tabs** moeten zien:
   - **iDEAL** 🏦
   - **Card** 💳
   - **Bancontact** (als geactiveerd)

## 🧪 iDEAL Test Mode

### Test Banks Beschikbaar:
- ABN AMRO
- ASN Bank
- Bunq
- ING
- Knab
- Rabobank
- RegioBank
- SNS Bank
- Triodos Bank
- Van Lanschot

### Test Flow:
1. **Selecteer iDEAL tab**
2. **Kies een test bank**
3. **Klik betalen**
4. **Wordt doorverwezen** naar test bank
5. **Automatisch succes** (in test mode)

## ❗ Veelvoorkomende Issues

### "iDEAL not available"
- **Oplossing:** Controleer of je account is geverifieerd
- **Check:** Business type is ingesteld

### "Payment method not enabled"
- **Oplossing:** Ga terug naar Payment Methods settings
- **Controleer:** iDEAL is echt geactiveerd

### Nog steeds geen iDEAL?
- **Clear browser cache**
- **Herstart development server**
- **Check console voor errors**

## 📋 Complete Checklist

- [ ] Stripe account aangemaakt
- [ ] Test keys ingevuld in .env.local
- [ ] iDEAL geactiveerd in dashboard
- [ ] Netherlands toegevoegd als land
- [ ] Development server herstart
- [ ] Browser cache geleegd

## 🎯 Resultaat
Na deze stappen zie je:
```
┌─────────────────┐
│ 🏦 iDEAL        │
│ 💳 Card         │  
│ 🇧🇪 Bancontact   │
└─────────────────┘
```

**Tijd nodig: ~3 minuten** ⏱️

