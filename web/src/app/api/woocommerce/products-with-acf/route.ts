import { NextRequest, NextResponse } from 'next/server';

const WC_API_URL = 'https://wasgeurtje.nl';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wcHeaders() {
  // Basic auth header for WooCommerce REST API
  const token = Buffer.from(`${CK}:${CS}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  short_description: string;
  description: string;
  stock_status: string;
  stock_quantity: number | null;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface ACFResponse {
  acf?: {
    parfum_tags?: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get('ids');
    
    if (!productIds) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    // Fetch products from WooCommerce
    const productsUrl = `${WC_API_URL}/wp-json/wc/v3/products?include=${productIds}&per_page=20`;
    
    const productsResponse = await fetch(productsUrl, {
      headers: wcHeaders(),
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!productsResponse.ok) {
      console.error('WooCommerce API Error:', productsResponse.status, await productsResponse.text());
      return NextResponse.json(
        { error: `WooCommerce API Error: ${productsResponse.statusText}` },
        { status: productsResponse.status }
      );
    }

    const products: WooCommerceProduct[] = await productsResponse.json();
    
    // Fetch ACF data for each product
    const productsWithACF = await Promise.all(
      products.map(async (product) => {
        try {
          // Fetch ACF data for this product
          const acfUrl = `${WC_API_URL}/wp-json/acf/v3/product/${product.id}?acf_format=standard`;
          
          const acfResponse = await fetch(acfUrl, {
            headers: {
              'Accept': 'application/json'
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
          });

          let acfData: ACFResponse = {};
          if (acfResponse.ok) {
            acfData = await acfResponse.json();
          } else {
            console.warn(`ACF data not found for product ${product.id}, status: ${acfResponse.status}`);
          }

          // Transform to our Product interface
          return {
            id: product.id.toString(),
            slug: product.slug,
            title: product.name,
            price: product.price ? `€${product.price}` : '€0,00',
            image: product.images?.[0]?.src || null,
            description: product.short_description || product.description || '',
            scents: acfData.acf?.parfum_tags || [], // Use ACF data only, no fallback
            stock_status: product.stock_status,
            stock_quantity: product.stock_quantity,
            categories: product.categories?.map(cat => cat.name) || [],
          };
        } catch (error) {
          console.error(`Error fetching ACF data for product ${product.id}:`, error);
          
          // Return product without ACF data as fallback
          return {
            id: product.id.toString(),
            slug: product.slug,
            title: product.name,
            price: product.price ? `€${product.price}` : '€0,00',
            image: product.images?.[0]?.src || null,
            description: product.short_description || product.description || '',
            scents: [], // No fallback scents - ACF data only
            stock_status: product.stock_status,
            stock_quantity: product.stock_quantity,
            categories: product.categories?.map(cat => cat.name) || [],
          };
        }
      })
    );

    return NextResponse.json(productsWithACF);
  } catch (error) {
    console.error('Error in products-with-acf API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
