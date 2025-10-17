// WordPress REST API Client voor Wasgeurtje.nl
const WORDPRESS_BASE_URL = 'https://wasgeurtje.nl';
const API_BASE = `${WORDPRESS_BASE_URL}/wp-json`;

// WooCommerce API credentials
const WC_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// API Endpoints
export const endpoints = {
  pages: `${API_BASE}/wp/v2/pages`,
  products: `${API_BASE}/wc/v3/products`,
  media: `${API_BASE}/wp/v2/media`,
  acf: `${API_BASE}/acf/v3`
};

// Fetch wrapper met error handling
async function apiRequest(url: string, options: RequestInit = {}, useWooCommerceAuth: boolean = false) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add WooCommerce authentication if needed
    if (useWooCommerceAuth) {
      const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WordPress API Error:', error);
    throw error;
  }
}

// Fetch page by ID met ACF velden
export async function getPageById(pageId: number): Promise<any> {
  const url = `${endpoints.pages}/${pageId}?acf_format=standard&_embed=true`;
  return apiRequest(url);
}

// Fetch wasparfum page (ID: 24)
export async function getWasparfumPageData() {
  try {
    return await getPageById(24);
  } catch (error) {
    console.error('Failed to fetch wasparfum page:', error);
    return null;
  }
}

// Fetch product by ID from WooCommerce API
export async function getProductById(productId: number): Promise<any> {
  const url = `${endpoints.products}/${productId}`;
  return apiRequest(url, {}, true); // Use WooCommerce auth
}

// Fetch multiple products by IDs
export async function getProductsByIds(productIds: number[]): Promise<any[]> {
  try {
    const promises = productIds.map(id => getProductById(id));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

// Fetch media by ID
export async function getMediaById(mediaId: number): Promise<any> {
  const url = `${endpoints.media}/${mediaId}`;
  return apiRequest(url);
}

// Transform WordPress product data to our format
export async function transformWordPressProduct(wpProduct: any) {
  try {
    // If we received product data from ACF (WordPress post type), 
    // we need to fetch the full WooCommerce product data
    let productData = wpProduct;
    
    // Check if this is ACF data (has ID or post_title) vs WooCommerce data (has id and name)
    if (wpProduct.ID && !wpProduct.price) {
      // This is ACF data, fetch full WooCommerce product
      console.log(`Fetching WooCommerce data for product ID: ${wpProduct.ID}`);
      try {
        productData = await getProductById(wpProduct.ID);
      } catch (error) {
        console.error(`Failed to fetch WooCommerce data for product ${wpProduct.ID}:`, error);
        // Fall back to ACF data
        productData = wpProduct;
      }
    }

    const productId = productData.id || productData.ID || wpProduct.ID;
    
    // Extract price data from WooCommerce response
    const price = productData.price || '0';
    const regularPrice = productData.regular_price || price;
    const salePrice = productData.sale_price || '';
    
    // Extract image data
    let mainImage = '';
    if (productData.images && productData.images.length > 0) {
      mainImage = productData.images[0].src;
    } else if (productData.featured_media) {
      // Fallback: try to get image from featured_media
      try {
        const mediaData = await getMediaById(productData.featured_media);
        mainImage = mediaData.source_url || mediaData.guid?.rendered || '';
      } catch (error) {
        console.error(`Failed to fetch media for product ${productId}:`, error);
      }
    }

    // Transform all images
    const images = productData.images ? productData.images.map((img: any) => ({
      id: img.id,
      src: img.src,
      alt: img.alt || productData.name || wpProduct.post_title
    })) : [{
      id: productId,
      src: mainImage || `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      alt: productData.name || wpProduct.post_title || ''
    }];

    return {
      id: productId,
      name: productData.name || wpProduct.post_title || '',
      slug: productData.slug || wpProduct.post_name || '',
      permalink: productData.permalink || wpProduct.link || `https://wasgeurtje.nl/product/${productData.slug || wpProduct.post_name}`,
      price: price,
      regular_price: regularPrice,
      sale_price: salePrice,
      images: images,
      short_description: productData.short_description || wpProduct.post_excerpt || '',
      description: productData.description || wpProduct.post_content || '',
      featured: productData.featured || false,
      stock_status: productData.stock_status || 'instock',
      categories: productData.categories || [],
      featured_media: productData.featured_media || wpProduct.featured_media
    };
  } catch (error) {
    console.error('Error transforming product:', error);
    // Return basic fallback data
    const productId = wpProduct.ID || wpProduct.id;
    return {
      id: productId,
      name: wpProduct.post_title || wpProduct.name || 'Product',
      slug: wpProduct.post_name || wpProduct.slug || '',
      permalink: `https://wasgeurtje.nl/product/${wpProduct.post_name || wpProduct.slug || ''}`,
      price: '0',
      regular_price: '0',
      sale_price: '',
      images: [{
        id: productId,
        src: `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
        alt: wpProduct.post_title || wpProduct.name || ''
      }],
      short_description: wpProduct.post_excerpt || '',
      description: wpProduct.post_content || '',
      featured: false,
      stock_status: 'instock',
      categories: [],
      featured_media: wpProduct.featured_media
    };
  }
}

// Get media URL from WordPress
export function getWordPressImageUrl(imageData: any, size: string = 'full'): string {
  if (!imageData) return '';
  
  if (typeof imageData === 'string') {
    return imageData;
  }
  
  if (imageData.sizes && imageData.sizes[size]) {
    return imageData.sizes[size];
  }
  
  if (imageData.url) {
    return imageData.url;
  }
  
  return imageData.source_url || '';
}