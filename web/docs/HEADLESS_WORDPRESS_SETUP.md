# Headless WordPress + Next.js Setup Guide

## Overview

This document explains how our headless WordPress setup works with Next.js as the frontend. WordPress serves as the content management system (CMS) and WooCommerce handles the e-commerce functionality, while Next.js renders everything on the frontend.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   WordPress     │  REST   │    Next.js       │         │   Users     │
│   + ACF         │  API    │    Frontend      │         │             │
│   + WooCommerce ├────────►│                  ├────────►│   Browser   │
│                 │         │   - Pages        │         │             │
│   Admin Panel   │         │   - Products     │         │             │
└─────────────────┘         │   - Cart/Checkout│         └─────────────┘
        │                   └──────────────────┘
        │                           │
        │ Webhook                   │ API Routes
        └──────────────────────────┘
```

## 1. WordPress Configuration

### Required Plugins
- **Advanced Custom Fields (ACF) Pro** - For flexible content fields
- **WooCommerce** - For product management
- **JWT Authentication** or Basic Auth for REST API
- **Yoast SEO** (optional) - For SEO metadata

### ACF Field Setup

Create a Field Group called "Page Builder" with Flexible Content field:

```
Field Name: flexible_content
Field Type: Flexible Content

Layouts:
1. hero_section
   - title (text)
   - subtitle (text)
   - background_image (image)
   - cta_text (text)
   - cta_link (url)

2. product_grid
   - title (text)
   - products (relationship to products)
   - columns (number)
   - show_prices (true/false)

3. text_image
   - title (text)
   - content (wysiwyg)
   - image (image)
   - image_position (select: left/right)

4. testimonials
   - title (text)
   - testimonials (repeater)
     - name (text)
     - location (text)
     - text (textarea)
     - rating (number)

5. faq
   - title (text)
   - questions (repeater)
     - question (text)
     - answer (textarea)
```

### Contact Page ACF Fields

```
Field Group: Contact Information
Location: Page Template = Contact

Fields:
- contact_info (group)
  - phone (text)
  - email (email)
  - address (text)
  - postal_code (text)
  - city (text)
  - country (text)
  - kvk (text)
  - btw (text)

- business_hours (group)
  - monday (text)
  - tuesday (text)
  - wednesday (text)
  - thursday (text)
  - friday (text)
  - saturday (text)
  - sunday (text)

- social_links (repeater)
  - platform (select: Facebook/Instagram/Twitter/LinkedIn)
  - url (url)
```

## 2. Next.js Implementation

### API Routes

#### `/api/wordpress/pages/route.ts`
Fetches WordPress pages with ACF data:
```typescript
// Fetch by slug
GET /api/wordpress/pages?slug=contact

// Fetch by ID
GET /api/wordpress/pages?id=123
```

#### `/api/woocommerce/products/route.ts`
Fetches WooCommerce products:
```typescript
// Fetch multiple products
GET /api/woocommerce/products?ids=1893,1425,1410
```

#### `/api/wordpress/revalidate/route.ts`
Webhook endpoint for cache invalidation:
```typescript
POST /api/wordpress/revalidate
{
  "secret": "your-secret-token",
  "type": "page",
  "slug": "contact"
}
```

### Component Registry

The system uses a component registry to map ACF layouts to React components:

```typescript
// ACF Layout → React Component Mapping
{
  "hero_section": "HeroSection",
  "product_grid": "ProductGrid",
  "text_image": "TextImageSection",
  "testimonials": "TestimonialsSection",
  "faq": "FAQSection"
}
```

### Dynamic Page Routing

The `[...slug]` catch-all route handles all WordPress pages:

```
/about → Fetches WordPress page with slug "about"
/services/consulting → Fetches page with slug "services/consulting"
```

## 3. Content Management Workflow

### Creating a New Page

1. **In WordPress:**
   - Create new page
   - Add ACF Flexible Content blocks
   - Publish page

2. **Automatic Updates:**
   - WordPress sends webhook to Next.js
   - Next.js revalidates the page cache
   - New content appears instantly

### Adding a New Component Type

1. **Create ACF Layout:**
   ```
   Layout Name: new_section
   Fields: title, description, etc.
   ```

2. **Create React Component:**
   ```typescript
   // components/sections/NewSection.tsx
   export default function NewSection({ title, description }) {
     return <section>...</section>
   }
   ```

3. **Register Component:**
   ```typescript
   // components/wordpress/ComponentRegistry.tsx
   const componentMap = {
     NewSection: dynamic(() => import('@/components/sections/NewSection')),
   }
   ```

4. **Add Transform Logic:**
   ```typescript
   // utils/wordpress-api.ts
   case 'new_section':
     return {
       component: 'NewSection',
       props: {
         title: section.title,
         description: section.description
       }
     };
   ```

## 4. Webhook Configuration

### WordPress Side

Install a webhook plugin or add to functions.php:

```php
add_action('save_post', 'notify_nextjs_on_update', 10, 3);

function notify_nextjs_on_update($post_id, $post, $update) {
    if ($post->post_status !== 'publish') {
        return;
    }
    
    $webhook_url = 'https://your-site.com/api/wordpress/revalidate';
    $body = [
        'secret' => 'your-secret-token',
        'type' => $post->post_type,
        'id' => $post_id,
        'slug' => $post->post_name
    ];
    
    wp_remote_post($webhook_url, [
        'body' => json_encode($body),
        'headers' => ['Content-Type' => 'application/json']
    ]);
}
```

### Environment Variables

```env
# .env.local
REVALIDATION_SECRET=your-secret-token-here
```

## 5. Preview Mode

### Implementation Steps

1. **Create Preview API Route:**
   ```typescript
   // app/api/preview/route.ts
   export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const secret = searchParams.get('secret');
     const slug = searchParams.get('slug');
     
     if (secret !== process.env.PREVIEW_SECRET) {
       return new Response('Invalid token', { status: 401 });
     }
     
     // Enable draft mode
     draftMode().enable();
     
     // Redirect to the page
     redirect(`/${slug}`);
   }
   ```

2. **WordPress Preview Button:**
   ```php
   add_filter('preview_post_link', 'custom_preview_link');
   
   function custom_preview_link($preview_link) {
     $post = get_post();
     $preview_url = 'https://your-site.com/api/preview';
     $preview_url .= '?secret=' . PREVIEW_SECRET;
     $preview_url .= '&slug=' . $post->post_name;
     return $preview_url;
   }
   ```

## 6. SEO Implementation

### Metadata Generation

Each page automatically generates SEO metadata from WordPress/Yoast:

```typescript
export async function generateMetadata({ params }) {
  const page = await fetchPage(params.slug);
  const seo = extractSEOData(page);
  
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [seo.ogImage]
    }
  };
}
```

### Sitemap Generation

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const pages = await fetchAllPages();
  const products = await fetchAllProducts();
  
  return [
    ...pages.map(page => ({
      url: `https://your-site.com/${page.slug}`,
      lastModified: page.modified,
    })),
    ...products.map(product => ({
      url: `https://your-site.com/products/${product.slug}`,
      lastModified: product.date_modified,
    }))
  ];
}
```

## 7. Performance Optimization

### Caching Strategy

1. **Static Generation (ISR):**
   ```typescript
   export const revalidate = 3600; // 1 hour
   ```

2. **On-Demand Revalidation:**
   - WordPress webhook triggers immediate update
   - No waiting for revalidation period

3. **API Route Caching:**
   ```typescript
   fetch(url, {
     next: { revalidate: 3600 }
   });
   ```

### Image Optimization

- Use Next.js Image component
- Configure remote patterns for WordPress media:

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wasgeurtje.nl',
      }
    ]
  }
}
```

## 8. Development Workflow

### Local Development

1. **Start Next.js:**
   ```bash
   npm run dev
   ```

2. **Configure API endpoints:**
   - Point to production WordPress for content
   - Use local WooCommerce for testing

### Adding New Features

1. **Content-First Approach:**
   - Design ACF fields first
   - Create sample content
   - Build components to match

2. **Type Safety:**
   ```typescript
   interface PageData {
     id: number;
     slug: string;
     title: string;
     acf: {
       flexible_content: FlexibleContent[];
     };
   }
   ```

## 9. Deployment

### Vercel Deployment

1. **Environment Variables:**
   ```
   WP_API_URL=https://wasgeurtje.nl/wp-json/wp/v2
   WC_API_URL=https://wasgeurtje.nl/wp-json/wc/v3
   WC_CONSUMER_KEY=ck_xxxxx
   WC_CONSUMER_SECRET=cs_xxxxx
   REVALIDATION_SECRET=your-secret
   ```

2. **Build Configuration:**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### WordPress Configuration

1. **Enable REST API**
2. **Configure CORS if needed**
3. **Set up webhook plugin**
4. **Configure authentication**

## 10. Troubleshooting

### Common Issues

1. **404 on Dynamic Pages:**
   - Check WordPress permalink settings
   - Verify page slug matches URL

2. **ACF Data Not Showing:**
   - Add `?acf_format=standard` to API calls
   - Check field group location rules

3. **Revalidation Not Working:**
   - Verify webhook secret matches
   - Check Next.js logs for webhook calls
   - Ensure correct paths are revalidated

4. **CORS Errors:**
   - Add WordPress domain to Next.js config
   - Configure WordPress CORS headers

## Conclusion

This headless setup provides:
- ✅ Fast, static site performance
- ✅ Familiar WordPress editing experience
- ✅ Modern React development
- ✅ Automatic content updates
- ✅ SEO optimization
- ✅ Scalable architecture

For questions or issues, check the logs in both WordPress and Next.js for debugging information.


