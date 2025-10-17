# Environment Setup Instructies

## .env.local Bestand Aanmaken

Om de WooCommerce API credentials veilig op te slaan, moet u een `.env.local` bestand aanmaken in de `web/` directory met de volgende inhoud:

```bash
# WooCommerce API Credentials
WOOCOMMERCE_CONSUMER_KEY=ck_c1f220f01e4f041f8133b8d627a830000f1f10a3
WOOCOMMERCE_CONSUMER_SECRET=cs_271d4242643cfcd942e0d77cead17e8e0c02f284
```

### Stappen:

1. Navigeer naar de `web/` directory
2. Maak een nieuw bestand aan genaamd `.env.local`
3. Kopieer de bovenstaande credentials naar het bestand
4. Sla het bestand op

### Belangrijk:

- Het `.env.local` bestand wordt automatisch door Next.js geladen
- Dit bestand mag NOOIT in version control (Git) worden opgenomen
- Zorg ervoor dat `.env.local` in uw `.gitignore` bestand staat
- Voor productie gebruik, vervang deze test credentials met echte productie credentials

### Bestanden die zijn aangepast:

1. `web/src/app/api/woocommerce/products/route.ts` - Gebruikt nu environment variabelen
2. `web/src/utils/auth-api.ts` - Gebruikt nu environment variabelen met fallback naar NEXT_PUBLIC_ versies

De code zal nu de credentials uit de environment variabelen laden in plaats van hardcoded waardes te gebruiken.
