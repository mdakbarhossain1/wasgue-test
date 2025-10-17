import { Product } from '../types/product';

// WooCommerce API credentials - configure these in your .env.local file
const WOOCOMMERCE_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create authentication for WooCommerce API
export const getAuthHeader = () => {
  const auth = Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');
  return `Basic ${auth}`;
};

export interface CategoryStructure {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
  permalink: string;
  children?: CategoryStructure[];
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_by: string;
  has_archives: boolean;
  terms?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    count: number;
  }[];
}

export interface WooCommerceStructure {
  categories: CategoryStructure[];
  attributes: ProductAttribute[];
  tags: any[];
  sampleProducts: Product[];
  urlStructure: {
    product: string;
    category: string;
    tag: string;
    attribute: string;
  };
}

// Functie om de categoriestructuur te ordenen in een hiërarchie
function organizeCategories(categories: CategoryStructure[]): CategoryStructure[] {
  const rootCategories: CategoryStructure[] = [];
  const childrenMap: Record<number, CategoryStructure[]> = {};

  // Groepeer eerst alle categorieën op parent
  categories.forEach(category => {
    if (category.parent === 0) {
      rootCategories.push({...category, children: []});
    } else {
      if (!childrenMap[category.parent]) {
        childrenMap[category.parent] = [];
      }
      childrenMap[category.parent].push(category);
    }
  });

  // Functie om recursief kinderen toe te voegen
  function addChildren(parentCategory: CategoryStructure) {
    const childCategories = childrenMap[parentCategory.id];
    if (childCategories) {
      parentCategory.children = childCategories.map(child => ({...child, children: []}));
      parentCategory.children.forEach(addChildren);
    }
    return parentCategory;
  }

  // Voeg kinderen toe aan de rootcategorieën
  return rootCategories.map(addChildren);
}

// Helper functie om de attributen te verrijken met termen
async function fetchAttributeTerms(attributes: ProductAttribute[]): Promise<ProductAttribute[]> {
  const enrichedAttributes = [];
  
  for (const attribute of attributes) {
    try {
      const response = await fetch(`${WOOCOMMERCE_API_URL}/products/attributes/${attribute.id}/terms`, {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching terms for attribute ${attribute.name}: ${response.statusText}`);
      }
      
      const terms = await response.json();
      enrichedAttributes.push({
        ...attribute,
        terms
      });
    } catch (error) {
      console.error(`Error fetching terms for attribute ${attribute.name}:`, error);
      enrichedAttributes.push(attribute);
    }
  }
  
  return enrichedAttributes;
}

// Helper function to detect URL structure from permalinks
function extractUrlPattern(permalink: string): string {
  // Extract the pattern from a full URL
  // e.g., from https://wasgeurtje.nl/product/sample-product/ extract /product/[slug]/
  const urlObj = new URL(permalink);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  
  if (pathSegments.length >= 2) {
    // Return the pattern with [parameter] notation
    return '/' + pathSegments.slice(0, -1).join('/') + '/[slug]/';
  }
  
  return '/[slug]/'; // Fallback
}

// Hoofdfunctie om de WooCommerce structuur op te halen
export async function fetchWooCommerceStructure(): Promise<WooCommerceStructure> {
  try {
    console.log('Fetching WooCommerce structure...');
    
    // Haal categorieën op
    const categoriesResponse = await fetch(`${WOOCOMMERCE_API_URL}/products/categories?per_page=100`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    if (!categoriesResponse.ok) {
      throw new Error(`Error fetching categories: ${categoriesResponse.statusText}`);
    }
    
    const categories = await categoriesResponse.json();
    console.log(`Found ${categories.length} categories`);
    
    // Haal attributen op
    const attributesResponse = await fetch(`${WOOCOMMERCE_API_URL}/products/attributes`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    if (!attributesResponse.ok) {
      throw new Error(`Error fetching attributes: ${attributesResponse.statusText}`);
    }
    
    const attributes = await attributesResponse.json();
    console.log(`Found ${attributes.length} attributes`);
    
    // Verrijk attributen met termen
    const enrichedAttributes = await fetchAttributeTerms(attributes);
    
    // Haal tags op
    const tagsResponse = await fetch(`${WOOCOMMERCE_API_URL}/products/tags`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    if (!tagsResponse.ok) {
      throw new Error(`Error fetching tags: ${tagsResponse.statusText}`);
    }
    
    const tags = await tagsResponse.json();
    console.log(`Found ${tags.length} tags`);
    
    // Haal enkele producten op om de structuur te analyseren
    const productsResponse = await fetch(`${WOOCOMMERCE_API_URL}/products?per_page=5`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    if (!productsResponse.ok) {
      throw new Error(`Error fetching products: ${productsResponse.statusText}`);
    }
    
    const products = await productsResponse.json();
    console.log(`Fetched ${products.length} sample products`);
    
    // Transformeer WooCommerce product data naar ons formaat
    const formattedProducts = products.map((product: any) => ({
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image: product.images && product.images.length > 0 ? product.images[0].src : '/figma/product-placeholder.png',
      price: formatPrice(product.price),
      scents: getScentsFromAttributes(product.attributes),
      permalink: product.permalink,
      rawData: product // Bewaar de ruwe data voor analyse
    }));
    
    // Organiseer categorieën in hiërarchie
    const organizedCategories = organizeCategories(categories);
    
    // Detecteer URL-structuur
    let productUrlPattern = '/product/[slug]/';
    let categoryUrlPattern = '/product-category/[slug]/';
    let tagUrlPattern = '/product-tag/[slug]/';
    let attributeUrlPattern = '/[attribute]/[value]/';
    
    // Detecteer product URL structuur van eerste product met permalink
    if (products.length > 0 && products[0].permalink) {
      productUrlPattern = extractUrlPattern(products[0].permalink);
    }
    
    // Detecteer categorie URL structuur
    if (categories.length > 0 && categories[0].permalink) {
      categoryUrlPattern = extractUrlPattern(categories[0].permalink);
    }
    
    // Detecteer tag URL structuur
    if (tags.length > 0 && tags[0].permalink) {
      tagUrlPattern = extractUrlPattern(tags[0].permalink);
    }
    
    return {
      categories: organizedCategories,
      attributes: enrichedAttributes,
      tags,
      sampleProducts: formattedProducts,
      urlStructure: {
        product: productUrlPattern,
        category: categoryUrlPattern,
        tag: tagUrlPattern,
        attribute: attributeUrlPattern
      }
    };
  } catch (error) {
    console.error('Error fetching WooCommerce structure:', error);
    throw error;
  }
}

// Helper functions from your existing code
function formatPrice(price: string): string {
  // Convert price to number, format with 2 decimal places, and use € symbol
  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) return '€0.00';
  
  // Format the price to match design (€15,95)
  return `€${priceNumber.toFixed(2).replace('.', ',')}`;
}

function getScentsFromAttributes(attributes: any[]): string[] {
  if (!attributes || !Array.isArray(attributes)) return [''];
  
  // Look for scent-related attributes
  const scentAttributes = attributes.find(attr => 
    attr.name?.toLowerCase().includes('scent') || 
    attr.name?.toLowerCase().includes('geur') ||
    attr.name?.toLowerCase().includes('notes')
  );
  
  if (scentAttributes && scentAttributes.options) {
    return scentAttributes.options;
  }
  
  // Default scents if none found
  return [''];
}
