## Project omschrijving
Dit project bouwt de storefront van wasgeurtje.nl na, sectie-voor-sectie op basis van Figma. We gebruiken de App Router van Next.js en TypeScript. Waar mogelijk hergebruiken we bestaande componenten. Ontwikkeling verloopt iteratief per Figma-sectie met focus op performance, accessibility, en SEO.

## Doelen (MVP)
- Homepagina met hero, USP’s, categorieën, bestsellers en reviews
- Productoverzicht (PLP) en productdetail (PDP)
- Winkelwagen en minimaal checkout-voorbereiding (UI)
- Navigatie (header/nav), footer en basispagina’s (FAQ/klantenservice)
- Zoekfunctionaliteit (UI) en filters (UI)
- NL-localisatie en basis SEO (metadata, structured data waar relevant)

## Technische stack
- Next.js (App Router, SSR/SSG waar passend)
- TypeScript (strict)
- Tailwind CSS
- Optioneel: shadcn/ui (alleen als het de velocity verhoogt)

## Architectuur en mappen
- Routing: `/`, `/collections/[slug]`, `/products/[slug]`, `/cart`, `/checkout`, `/search`, `/account` (optioneel)
- Componenten: `app/(routes)/...`, `components/ui`, `components/sections`, `lib` voor helpers
- Data: in eerste instantie mocked/fixtures; later real data (bijv. via CMS/DB)

## Ontwikkelvolgorde
1. Layout: `RootLayout`, `Header`, `Footer`, theming/typografie
2. Home-secties: Hero → USP’s → Categoriegrid → Bestsellers → Reviews → Promobanner
3. PLP: grid, filters, sortering, pagination
4. PDP: galerij, variantselectie, prijs, add-to-cart, badges, reviews
5. Cart en mini-cart
6. Checkout UI (minimaal flow, nog zonder payment-koppeling)
7. Zoek UI (modal/pagina) en resultaten
8. Contentpagina’s (FAQ/klantenservice) en 404/empty states

## MCP + Figma workflow
- Selecteer in Figma de relevante frame/sectie. We halen via MCP een preview en variabelen op om structuur en buildvolgorde te bepalen.
- Assets (iconen/beelden) exporteren we via Figma waar nodig.

## Kwaliteitsrichtlijnen
- Performance: image optimization, lazy-loading, code-splitting
- Toegankelijkheid: semantiek, focus states, kleurcontrast
- SEO: metadata per route, nette URL’s, structured data waar relevant
- Code: duidelijke namen, guard clauses, error handling waar nodig

## Uitvoering en afspraken
- Geen automatische `npm run dev` door het systeem.
- Port 3000 voor lokale development.
- Reuse-first: bestaande UI en patterns hergebruiken waar mogelijk.
- Conventies: Conventional Commits, Prettier/ESLint.

Deploy 003
Deploy 004
Deploy 005