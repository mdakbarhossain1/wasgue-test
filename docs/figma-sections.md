## Figma mapping — Homepagina

Bron: huidig geselecteerde Figma frame (preview via MCP) en variabelen.

### Secties (boven naar beneden)
1. Announcement bar (promo/kortingsregel)
2. Header: logo, hoofdnavigatie, hulplinks (account, help), zoek, cart
3. Hero: H1, subcopy, CTA, visual rechts, decoratieve wave-divider
4. USP-bar: 3-4 iconen met labels (bijv. snelle levering, premium geuren, eco)
5. Categorie-tegels: "Best Sellers", "Best Scents", "Trial Pack", "Gift Sets"
6. Productrail: Bestsellers (cards met afbeelding, titel, prijs, CTA)
7. Trust/social proof strip: badges of reviews (Trustpilot/Google/review quotes)
8. How it works: 3 stappen met iconen/afbeeldingen
9. Finder: "Find Your Perfect Perfume" (quiz CTA of filter CTA)
10. Sustainability/brand values: 4 iconen + korte teksten
11. Promo/push: "Luxury Perfume Trial Pack" (image left, copy + CTA)
12. Loyalty: "Reward Your Love Of Laundry" (punten/benefits + CTA)
13. Newsletter/CTA-strip
14. Footer: merklogo, navigatiekolommen, socials, badges, copyright

### Componenten per sectie
- AnnouncementBar: compacte topbar, optioneel dismissible
- SiteHeader: nav, search, account, cart, responsive menu
- HomeHero: headline (EB Garamond), CTA, media, shape-divider
- UspList: iconen + labels (3-4 items)
- CategoryTiles: 2x2 grid met tegels en CTA
- ProductCarousel/Grid: responsive productcards
- ReviewStrip: badges/quotes, horizontale scroller op mobiel
- HowItWorks: 3-step grid
- FinderCta: callout met knop
- ValuesStrip: 4 iconen + beschrijving
- PromoFeature: media-left, copy-right, knop
- LoyaltyCard: benefits list + CTA
- NewsletterCta: input + submit
- SiteFooter: kolommen + legal

### Design tokens (afgeleid uit Figma variabelen)
- Kleuren:
  - White: #FFFFFF
  - Black text: #212529
  - Gold: #FCCE4E
  - Light Brown: #D6AD61
  - Brown: #814E1E
- Typografie:
  - H1: EB Garamond, 56/1.2, 600
  - H2: EB Garamond, 32/1.2, 600
  - H3: EB Garamond, 24/1.2, 600
  - T1: Helvetica, 24/1.5, 400
  - T2: Helvetica, 18/1.5, 400
  - T3: Helvetica, 16/1.5, 400
  - T4: Helvetica, 14/1.5, 400

### Buildvolgorde (MVP)
1. Layout: `RootLayout`, `SiteHeader`, `SiteFooter`
2. Home: `HomeHero` → `UspList` → `CategoryTiles` → `ProductCarousel`
3. `ReviewStrip` → `HowItWorks` → `FinderCta` → `ValuesStrip`
4. `PromoFeature` → `LoyaltyCard` → `NewsletterCta`
5. Routing placeholders: PLP `/collections/[slug]`, PDP `/products/[slug]`, `cart`, `checkout`, `search`

### Notities
- Gebruik Tailwind thema-extensies voor kleuren en font stacks (EB Garamond, Helvetica-system fallback)
- Wave-divider in hero als SVG asset; mobile-first stapelen van hero content
- Carousels: simpel met snap-x/snap-mandatory; later eventueel Swiper/Embla 