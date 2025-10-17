import { WasparfumPage, Product } from "types/acf";

const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL || "https://wasgeurtje.nl/wp-json";

// WordPress API endpoints
const endpoints = {
  pages: `${WORDPRESS_API_URL}/wp/v2/pages`,
  products: `${WORDPRESS_API_URL}/wc/v3/products`,
  media: `${WORDPRESS_API_URL}/wp/v2/media`,
};

// Fetch options with authentication if needed
const fetchOptions: RequestInit = {
  headers: {
    "Content-Type": "application/json",
    // Add authentication headers if needed
    ...(process.env.WORDPRESS_API_KEY && {
      Authorization: `Bearer ${process.env.WORDPRESS_API_KEY}`,
    }),
  },
  next: { revalidate: 3600 }, // Revalidate every hour
};

/**
 * Fetch a specific page by ID or slug
 */
export async function getPageBySlug(
  slug: string
): Promise<WasparfumPage | null> {
  try {
    const response = await fetch(
      `${endpoints.pages}?slug=${slug}&acf_format=standard&_embed=true`,
      fetchOptions
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch page: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const pages = await response.json();

    if (!Array.isArray(pages) || pages.length === 0) {
      return null;
    }

    return pages[0] as WasparfumPage;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

/**
 * Fetch a specific page by ID
 */
export async function getPageById(id: number): Promise<WasparfumPage | null> {
  try {
    const response = await fetch(
      `${endpoints.pages}/${id}?acf_format=standard&_embed=true`,
      fetchOptions
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch page: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return (await response.json()) as WasparfumPage;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

/**
 * Fetch products by IDs
 */
export async function getProductsByIds(
  productIds: number[]
): Promise<Product[]> {
  if (!productIds.length) return [];

  try {
    const response = await fetch(
      `${endpoints.products}?include=${productIds.join(",")}&per_page=100`,
      {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          // WooCommerce API requires authentication
          Authorization: `Basic ${Buffer.from(
            `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch products: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const products = await response.json();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Fetch all products with pagination
 */
export async function getAllProducts(
  page = 1,
  perPage = 20
): Promise<Product[]> {
  try {
    const response = await fetch(
      `${endpoints.products}?page=${page}&per_page=${perPage}&status=publish`,
      {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Basic ${Buffer.from(
            `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch products: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const products = await response.json();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Transform WordPress ACF field data to match our types
 */
export function transformPageBuilderSections(acf: any) {
  if (!acf?.page_builder) return [];

  return acf.page_builder.map((section: any) => {
    switch (section.acf_fc_layout) {
      case "product":
      case "fancy_product":
        return {
          ...section,
          // Transform product IDs to full product objects if needed
          products: section.products || [],
        };

      case "infobox":
        return {
          ...section,
          box: section.box || [],
        };

      case "image_text_block":
        return {
          ...section,
          list: section.list || [],
        };

      case "faq":
        return {
          ...section,
          faq: section.faq || [],
        };

      default:
        return section;
    }
  });
}

/**
 * Get the wasparfum page specifically
 */
export async function getWasparfumPage(): Promise<WasparfumPage | null> {
  // Try to get by slug first
  let page = await getPageBySlug("wasparfum");

  // If not found by slug, try by ID (24 based on WordPress admin)
  if (!page) {
    page = await getPageById(24);
  }

  return page;
}
