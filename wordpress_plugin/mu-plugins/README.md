# Customer Address Manager MU-Plugin

## Installatie

1. Upload het bestand `customer-address-manager.php` naar de `wp-content/mu-plugins/` directory van je WordPress installatie.
   
   Als de `mu-plugins` directory niet bestaat, maak deze dan aan:
   ```
   wp-content/mu-plugins/
   ```

2. Het bestand wordt automatisch geladen door WordPress. Er is geen activatie nodig.

## Functionaliteit

Deze mu-plugin voegt de volgende functionaliteit toe:

### REST API Endpoints

1. **DELETE** `/wp-json/wp-loyalty-rules/v1/customer/address/delete`
   - Verwijdert een opgeslagen adres van een klant
   - Parameters: `email`, `addressId`

2. **GET** `/wp-json/wp-loyalty-rules/v1/customer/addresses`
   - Haalt alle opgeslagen adressen van een klant op
   - Parameters: `email`

### Automatische Adres Opslag

- Bij elke nieuwe bestelling wordt het bezorgadres automatisch opgeslagen
- Maximaal 10 adressen per klant worden bewaard
- Dubbele adressen worden automatisch gefilterd

### Data Opslag

Adressen worden opgeslagen in WordPress user meta met de key `saved_delivery_addresses`.

## Gebruik in Frontend

De frontend kan de endpoints aanroepen via de Next.js API routes die al zijn geconfigureerd.


