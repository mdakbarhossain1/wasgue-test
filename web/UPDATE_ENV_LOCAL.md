# Update uw .env.local bestand

## Probleem
De WooCommerce API geeft een 401 error omdat de environment variabelen niet correct worden geladen in de browser context.

## Oplossing
Update uw `web/.env.local` bestand met de volgende inhoud:

```bash
# WooCommerce API Credentials (server-side)
WOOCOMMERCE_CONSUMER_KEY=ck_c1f220f01e4f041f8133b8d627a830000f1f10a3
WOOCOMMERCE_CONSUMER_SECRET=cs_271d4242643cfcd942e0d77cead17e8e0c02f284

# WooCommerce API Credentials (client-side/browser)
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=ck_c1f220f01e4f041f8133b8d627a830000f1f10a3
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=cs_271d4242643cfcd942e0d77cead17e8e0c02f284
```

## Belangrijke punten:
1. In Next.js zijn alleen variabelen met `NEXT_PUBLIC_` prefix beschikbaar in de browser
2. De `fetchCustomerOrders` functie wordt vanuit de browser aangeroepen via `AuthContext.tsx`
3. Daarom moet u beide versies (met en zonder prefix) toevoegen

## Stappen:
1. Open uw bestaande `web/.env.local` bestand
2. Voeg de `NEXT_PUBLIC_` versies toe zoals hierboven getoond
3. Sla het bestand op
4. **BELANGRIJK**: Stop de Next.js development server (Ctrl+C)
5. Start de server opnieuw: `npm run dev`
6. Test de applicatie opnieuw

De server moet opnieuw gestart worden om de nieuwe environment variabelen te laden!
