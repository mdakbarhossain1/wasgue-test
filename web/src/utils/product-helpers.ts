import {
  Product,
  ProductInfoSection,
  ProductIngredient,
  ProductHighlight,
  RelatedProduct,
} from "types/product";

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

// Helper function to create a short description
function createShortDescription(text: string, maxLength: number = 60): string {
  // Verwijder extra witruimte en maak een korte versie
  const cleanText = text.trim().replace(/\s+/g, " ");

  // Bepaal de eerste zin of een deel ervan
  const firstSentence =
    cleanText.split(/[.!?]/).filter((s) => s.trim().length > 0)[0] || cleanText;

  // Verkort de tekst indien nodig
  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }

  // Zoek een natuurlijk breekpunt (na een woord)
  let shortText = firstSentence.substring(0, maxLength);
  const lastSpace = shortText.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    // Alleen afbreken bij een spatie als we niet te veel tekst verliezen
    shortText = shortText.substring(0, lastSpace);
  }

  return shortText + "...";
}

// WooCommerce API endpoints
const WOOCOMMERCE_API_URL =
  process.env.WOOCOMMERCE_API_URL || "https://wasgeurtje.nl/wp-json/wc/v3";
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create authentication for WooCommerce API
export const getAuthHeader = () => {
  const auth = Buffer.from(
    `${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`
  ).toString("base64");
  return `Basic ${auth}`;
};

// Helper function to format price
export function formatPrice(price: string): string {
  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) return "€0,00";
  return `€${priceNumber.toFixed(2).replace(".", ",")}`;
}

// Helper function to get meta data by key
export function getMetaData(metaData: any[] | undefined, key: string): any {
  if (!metaData || !Array.isArray(metaData)) return null;

  const meta = metaData.find((item) => item.key === key);
  return meta ? meta.value : null;
}

// Function to get scents from attributes
export function getScentsFromAttributes(attributes: any[]): string[] {
  if (!attributes || !Array.isArray(attributes)) return [];

  const scentAttributes = attributes.find(
    (attr) =>
      attr.name?.toLowerCase().includes("scent") ||
      attr.name?.toLowerCase().includes("geur") ||
      attr.name?.toLowerCase().includes("notes")
  );

  if (scentAttributes && scentAttributes.options) {
    return scentAttributes.options;
  }

  return [];
}

// Function to fetch product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${WOOCOMMERCE_API_URL}/products/${id}`, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Error fetching product: ${response.statusText}`);
    }

    const product = await response.json();

    // Format all product attributes
    const formattedAttributes =
      product.attributes?.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        position: attr.position,
        visible: attr.visible,
        variation: attr.variation,
        options: attr.options || [],
      })) || [];

    // Return formatted product data
    return {
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images[0].src
          : "/figma/product-flower-rain.png",
      images: product.images?.map((img: any) => img.src) || [],
      price: formatPrice(product.price),
      scents: getScentsFromAttributes(product.attributes),
      description: product.short_description,
      full_description: product.description,
      attributes: formattedAttributes,
      categories:
        product.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })) || [],
      tags:
        product.tags?.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })) || [],
      meta_data: product.meta_data,
      sku: product.sku,
      stock_status: product.stock_status,
      on_sale: product.on_sale,
      sale_price: product.sale_price
        ? formatPrice(product.sale_price)
        : undefined,
      regular_price: product.regular_price
        ? formatPrice(product.regular_price)
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

// Function to fetch product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?slug=${slug}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching product: ${response.statusText}`);
    }

    const products = await response.json();

    if (!products || products.length === 0) {
      return null;
    }

    const product = products[0];

    // Format all product attributes
    const formattedAttributes =
      product.attributes?.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        position: attr.position,
        visible: attr.visible,
        variation: attr.variation,
        options: attr.options || [],
      })) || [];

    // Return formatted product data
    return {
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images[0].src
          : "/figma/product-flower-rain.png",
      images: product.images?.map((img: any) => img.src) || [],
      price: formatPrice(product.price),
      scents: getScentsFromAttributes(product.attributes),
      description: product.short_description,
      full_description: product.description,
      attributes: formattedAttributes,
      categories:
        product.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })) || [],
      tags:
        product.tags?.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })) || [],
      meta_data: product.meta_data,
      sku: product.sku,
      stock_status: product.stock_status,
      on_sale: product.on_sale,
      sale_price: product.sale_price
        ? formatPrice(product.sale_price)
        : undefined,
      regular_price: product.regular_price
        ? formatPrice(product.regular_price)
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

// Function to fetch multiple products by IDs
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?include=${ids.join(",")}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.statusText}`);
    }

    const products = await response.json();

    // Transform WooCommerce product data to our Product format
    return products.map((product: any) => ({
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images[0].src
          : "/figma/product-flower-rain.png",
      images: product.images?.map((img: any) => img.src) || [],
      price: formatPrice(product.price),
      scents: getScentsFromAttributes(product.attributes),
      description: product.short_description,
      full_description: product.description,
      attributes:
        product.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          position: attr.position,
          visible: attr.visible,
          variation: attr.variation,
          options: attr.options || [],
        })) || [],
      categories:
        product.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })) || [],
      tags:
        product.tags?.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })) || [],
      meta_data: product.meta_data,
      sku: product.sku,
      stock_status: product.stock_status,
      on_sale: product.on_sale,
      sale_price: product.sale_price
        ? formatPrice(product.sale_price)
        : undefined,
      regular_price: product.regular_price
        ? formatPrice(product.regular_price)
        : undefined,
    }));
  } catch (error) {
    console.error(`Error fetching products by IDs ${ids}:`, error);
    return [];
  }
}

// Function to get product info sections from meta data
export function getProductInfoSections(product: Product): ProductInfoSection[] {
  const sections: ProductInfoSection[] = [];

  // Check for specific product meta sections
  if (product.meta_data) {
    const sectionCount = parseInt(
      getMetaData(product.meta_data, "info_sections_count") || "0"
    );

    for (let i = 0; i < sectionCount; i++) {
      const title = getMetaData(product.meta_data, `info_section_${i}_title`);
      const content = getMetaData(
        product.meta_data,
        `info_section_${i}_content`
      );

      if (title && content) {
        sections.push({ title, content });
      }
    }
  }

  // If no specific sections found, try to extract from attributes
  if (sections.length === 0 && product.attributes) {
    const visibleAttrs = product.attributes.filter((attr) => attr.visible);

    for (const attr of visibleAttrs) {
      sections.push({
        title: attr.name,
        content: attr.options.join(", "),
      });
    }
  }

  return sections;
}

// Function to get product ingredients from ACF data or meta data
export function getProductIngredients(product: Product): ProductIngredient[] {
  console.log("Getting ingredients for product:", product.title);

  // First check if we have ingredients from ACF data
  if (product.ingredients && product.ingredients.length > 0) {
    console.log(
      "Found ingredients from ACF:",
      JSON.stringify(product.ingredients, null, 2)
    );

    // Check if we need to process the image formats
    const processedIngredients = product.ingredients.map((ingredient) => {
      if (ingredient.image && typeof ingredient.image === "object") {
        console.log(
          `Processing ACF image object for ingredient "${ingredient.name}":`,
          ingredient.image
        );

        // Return ingredient with the image object intact - we'll handle this in getIngredientImageSrc
        return ingredient;
      }
      return ingredient;
    });

    return processedIngredients;
  } else {
    console.log(
      "No ingredients found in ACF data, checking meta_data or using fallbacks"
    );
  }

  // Fall back to old meta_data method if ACF data is not available
  const ingredients: ProductIngredient[] = [];

  if (product.meta_data) {
    const ingredientCount = parseInt(
      getMetaData(product.meta_data, "ingredients_count") || "0"
    );
    console.log(`Found ${ingredientCount} ingredients in meta_data`);

    for (let i = 0; i < ingredientCount; i++) {
      const name = getMetaData(product.meta_data, `ingredient_${i}_name`);
      const image = getMetaData(product.meta_data, `ingredient_${i}_image`);

      if (name && image) {
        ingredients.push({ name, image });
        console.log(`Added ingredient from meta_data: ${name}`);
      }
    }
  }

  return ingredients;
}

// Function to get product highlights from meta data
export function getProductHighlights(product: Product): ProductHighlight[] {
  const highlights: ProductHighlight[] = [];

  if (product.meta_data) {
    const highlightCount = parseInt(
      getMetaData(product.meta_data, "highlights_count") || "0"
    );

    for (let i = 0; i < highlightCount; i++) {
      const text = getMetaData(product.meta_data, `highlight_${i}`);

      if (text) {
        highlights.push({ text });
      }
    }
  }

  return highlights;
}

// Function to fetch related products - now showing most sold products per month
export async function getRelatedProducts(
  product: Product
): Promise<RelatedProduct[]> {
  try {
    // Construct query params for the API request to get best selling products
    const params = new URLSearchParams({
      orderby: "popularity", // Order by popularity (most sold)
      exclude: product.id, // Exclude the current product
      per_page: "4", // Limit to 4 related products
      status: "publish", // Only published products
    });

    // Make the API request
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?${params.toString()}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching best selling products: ${response.statusText}`
      );
    }

    const bestSellingProducts = await response.json();

    // Transform WooCommerce product data to our format
    return bestSellingProducts
      .filter((relProduct: any) => relProduct.id.toString() !== product.id) // Extra check to exclude current product
      .slice(0, 4) // Limit to 4 products
      .map((relProduct: any) => ({
        id: relProduct.id.toString(),
        slug: relProduct.slug,
        title: relProduct.name,
        image:
          relProduct.images && relProduct.images.length > 0
            ? relProduct.images[0].src
            : "/figma/product-flower-rain.png",
        price: formatPrice(relProduct.price),
        sale: relProduct.on_sale,
        originalPrice: relProduct.on_sale
          ? formatPrice(relProduct.regular_price)
          : undefined,
        points: Math.floor(Math.random() * 3) + 8, // Random points between 8-10
        description: relProduct.short_description
          ? // Verkorte beschrijving voor betere weergave in productkaarten
            createShortDescription(stripHtml(relProduct.short_description))
          : undefined,
      }));
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return [];
  }
}
