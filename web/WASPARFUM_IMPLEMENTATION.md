# Wasparfum Page Implementation

## Overzicht

Deze implementatie reproduceert de WordPress ACF Page Builder structuur van de wasparfum pagina in Next.js met volledige 1:1 compatibiliteit.

## WordPress ACF Structuur Geanalyseerd

### Page Builder Componenten

1. **Product Section** (`product`)
   - Section Title
   - Products (multi-select)

2. **Fancy Product Section** (`fancy_product`)
   - Background Image
   - Section Title
   - Sub Title
   - Products (multi-select)
   - Product Note

3. **Infobox Section** (`infobox`)
   - Section Title
   - Details
   - Info Type (Box/Number radio)
   - Box Items (repeater: title, details)

4. **Image Text Block Section** (`image_text_block`)
   - Image
   - Title
   - Content (WYSIWYG)
   - List Type (Number/Timeline/Checked radio)
   - List Items (repeater: text)
   - Extra Content (WYSIWYG)

5. **FAQ Section** (`faq`)
   - Section Title (optional)
   - FAQ Items (repeater: question, answer)

## Bestandsstructuur

```
web/src/
├── types/
│   └── acf.ts                           # TypeScript types voor alle ACF velden
├── components/page-builder/
│   ├── index.ts                         # Export bestand
│   ├── PageBuilder.tsx                  # Hoofdcomponent die alle secties rendert
│   ├── ProductSection.tsx               # Product grid sectie
│   ├── FancyProductSection.tsx          # Luxe product sectie met achtergrond
│   ├── InfoboxSection.tsx               # Informatieve box/number sectie
│   ├── ImageTextBlockSection.tsx        # Afbeelding + tekst + lijst sectie
│   └── FAQSection.tsx                   # Accordeon FAQ sectie
├── lib/
│   └── wordpress.ts                     # WordPress API utilities
└── app/wasparfum/
    └── page.tsx                         # Hoofdpagina template
```

## Implementatie Details

### TypeScript Types (`acf.ts`)
- Volledige typering van alle ACF velden
- Union types voor verschillende sectie layouts
- Product interface compatible met WooCommerce API
- Strict typing voor veilige development

### React Componenten
- **Modulair**: Elke sectie is een aparte component
- **Responsive**: Mobile-first design met Tailwind CSS
- **Accessible**: ARIA labels, keyboard navigation, focus states
- **Modern Design**: 2025 trends met glassmorphism, gradients, hover effects
- **Performance**: Next.js Image optimization, lazy loading

### WordPress API Integratie
- **Flexible**: Ondersteunt zowel slug als ID lookup
- **Cached**: Next.js revalidation voor performance
- **Secure**: Support voor WordPress API authentication
- **WooCommerce**: Product data via WC REST API
- **Fallback**: Mock data voor development

### Design Features
- **Brand Colors**: #1d1d1d (dark), #e9c356 (goud), #F8F6F0 (cream)
- **Gradients**: Smooth color transitions
- **Animations**: Hover effects, transitions, transforms
- **Typography**: Bold headings, readable content
- **Spacing**: Consistent 16px base units
- **Shadows**: Layered depth with modern shadows

## WordPress API Endpoints

```bash
# Pages
GET /wp/v2/pages?slug=wasparfum&acf_format=standard
GET /wp/v2/pages/24?acf_format=standard

# Products (WooCommerce)
GET /wc/v3/products?include={ids}
GET /wc/v3/products?page=1&per_page=20
```

## Environment Variables

```bash
# .env.local
WORDPRESS_API_URL=https://wasgeurtje.nl/wp-json
WORDPRESS_API_KEY=your_jwt_token_here
WC_CONSUMER_KEY=your_woocommerce_key
WC_CONSUMER_SECRET=your_woocommerce_secret
```

## Usage

### Basic Implementation
```tsx
import { PageBuilder } from '@/components/page-builder';
import { getWasparfumPage } from '@/lib/wordpress';

export default async function Page() {
  const page = await getWasparfumPage();
  
  return (
    <main>
      <PageBuilder sections={page.acf.page_builder} />
    </main>
  );
}
```

### Custom Section Rendering
```tsx
import { ProductSection, FAQSection } from '@/components/page-builder';

// Render specific sections only
<ProductSection section={productData} />
<FAQSection section={faqData} />
```

### API Data Fetching
```tsx
import { getPageBySlug, getProductsByIds } from '@/lib/wordpress';

const page = await getPageBySlug('wasparfum');
const products = await getProductsByIds([1, 2, 3]);
```

## SEO Features

- **Metadata**: Complete OpenGraph, Twitter Cards
- **Structured Data**: JSON-LD for rich snippets
- **Canonical URLs**: Proper canonical tags
- **Meta Descriptions**: SEO-optimized descriptions
- **Alt Tags**: Comprehensive image alt text

## Performance Optimizations

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Dynamic imports where beneficial
- **Caching**: ISR with 1-hour revalidation
- **Bundle Size**: Tree-shaking, selective imports
- **Critical CSS**: Above-the-fold prioritization

## Accessibility Features

- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard access
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliance
- **Semantic HTML**: Proper heading hierarchy

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Progressive Enhancement**: Graceful degradation
- **CSS Grid**: Modern layout with fallbacks
- **JavaScript**: ES6+ features with polyfills if needed

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

## Testing

```bash
# Run tests
npm test

# Component testing
npm run test:components

# E2E testing
npm run test:e2e
```

## Deployment

De implementatie is ready voor productie met:
- **Server-Side Rendering**: Voor SEO en performance
- **Static Generation**: Voor snelle loading
- **Edge Functions**: Voor optimale gebruikerservaring
- **CDN Integration**: Voor wereldwijde distributie

## Troubleshooting

### Common Issues

1. **WordPress API Connection**
   - Controleer CORS instellingen
   - Verificeer API endpoints
   - Check authentication tokens

2. **Missing Product Data**
   - Verify WooCommerce API keys
   - Check product IDs in ACF fields
   - Ensure products are published

3. **Image Loading Issues**
   - Verify image URLs are accessible
   - Check Next.js image domains configuration
   - Ensure proper alt text is provided

### Debug Mode

```tsx
// Enable debug logging
process.env.NODE_ENV === 'development' && console.log('Page data:', pageData);
```

## Future Enhancements

- **Animation Library**: Framer Motion voor geavanceerde animaties
- **Image Gallery**: Lightbox voor product afbeeldingen
- **Search & Filter**: Geavanceerde product filtering
- **Internationalization**: Multi-language support
- **Analytics**: Enhanced tracking en monitoring

Deze implementatie biedt een volledig functionele, schaalbare en onderhoudbare oplossing die de WordPress ACF Page Builder structuur perfect reproduceert in Next.js.
