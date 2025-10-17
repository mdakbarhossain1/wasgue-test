// WooCommerce API utility functions
import { Product } from "../types/product";

// WooCommerce API credentials
const WOOCOMMERCE_API_URL =
  process.env.WOOCOMMERCE_API_URL || "https://wasgeurtje.nl/wp-json/wc/v3";
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Wasparfum categorie ID
const WASPARFUM_CATEGORY_ID = 309;

// Tab Product IDs
const BEST_SELLERS_IDS = [
  "1893", // wasparfum-proefpakket
  "335060", // wasgeurtje-wasstrips
  "1410", // blossom-drip
  "1425", // full-moon
];

const PREMIUM_IDS = [
  "267628", // nieuwe-geurcollectie-proefpakket
  "273947", // white-musk
  "273946", // evening-dew
  "273949", // ylang-scent
];

const COLLECTIONS_IDS = [
  "263341", // cadeauset-wasparfum
  "1893", // wasparfum-proefpakket
  "267628", // nieuwe-geurcollectie-proefpakket
  "335706", // wasgeurtje-combideal
];

// Map tab type to product IDs
export const getProductIdsByTab = (
  tab: "best-sellers" | "premium" | "collections"
) => {
  switch (tab) {
    case "best-sellers":
      return BEST_SELLERS_IDS;
    case "premium":
      return PREMIUM_IDS;
    case "collections":
      return COLLECTIONS_IDS;
    default:
      return BEST_SELLERS_IDS;
  }
};

// Create authentication for WooCommerce API
export const getAuthHeader = () => {
  const auth = Buffer.from(
    `${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`
  ).toString("base64");
  return `Basic ${auth}`;
};

// Fetch products from WooCommerce API
export async function fetchProducts(
  tabOrIds: "best-sellers" | "premium" | "collections" | string[]
): Promise<Product[]> {
  try {
    // Get product IDs - either from tab or directly
    const productIds = Array.isArray(tabOrIds)
      ? tabOrIds
      : getProductIdsByTab(tabOrIds);

    // Construct query params for the API request
    const params = new URLSearchParams({
      include: productIds.join(","),
      per_page: "20",
    });

    console.log(`Fetching products, IDs: ${productIds.join(",")}`);

    // Make the API request
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?${params.toString()}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.statusText}`);
    }

    const products = await response.json();

    // Transform WooCommerce product data to our format
    return products.map((product: any) => ({
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images[0].src
          : "/figma/product-flower-rain.png",
      price: formatPrice(product.price),
      scents: getScentsFromAttributes(product.attributes),
      description: product.short_description
        ? stripHtml(product.short_description)
        : "",
      full_description: product.description,
      meta_data: product.meta_data,
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Nieuw: Functie om alle wasparfum producten op te halen
export async function getAllWasparfums(limit: number = 30): Promise<Product[]> {
  try {
    // Parameter category=XX toevoegen voor de wasparfum categorie
    const params = new URLSearchParams({
      category: WASPARFUM_CATEGORY_ID.toString(),
      per_page: limit.toString(),
      status: "publish",
      order: "asc",
      orderby: "title",
    });

    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?${params.toString()}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache voor 1 uur
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching wasparfum products: ${response.statusText}`
      );
    }

    const products = await response.json();

    // Transform WooCommerce product data to our format
    return products
      .filter((product: any) => product.name && product.price)
      .map((product: any) => ({
        id: product.id.toString(),
        slug: product.slug,
        title: product.name,
        image:
          product.images && product.images.length > 0
            ? product.images[0].src
            : "/figma/product-flower-rain.png",
        price: formatPrice(product.price),
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        scents: getScentsFromAttributes(product.attributes),
        on_sale: product.on_sale,
        stock_status: product.stock_status,
        description: product.short_description || "",
      }));
  } catch (error) {
    console.error("Error fetching wasparfum products:", error);
    return [];
  }
}

// Fetch a single product by slug
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
    const productId = product.id.toString();

    // Fetch ACF fields for this product
    let ingredients = [];
    let productInfo = [];
    let iconInfo = [];
    let experienceItems = [];
    let details = [];
    let bottomCheck = [];
    let bottom_check_title: string | undefined = undefined;
    let checkboxtitle: string | undefined = undefined;

    try {
      console.log("Fetching ACF data for product ID:", productId);
      // Use acf_format=standard to get the full image objects
      const acfResponse = await fetch(
        `https://wasgeurtje.nl/wp-json/acf/v3/product/${productId}?acf_format=standard`,
        {
          next: { revalidate: 3600 }, // Cache for 1 hour
          headers: {
            Accept: "application/json",
            Origin: "http://localhost:3000",
          },
        }
      );

      console.log("ACF API response status:", acfResponse.status);
      console.log("ACF API response Data:", acfResponse);

      if (acfResponse.ok) {
        const acfData = await acfResponse.json();
        console.log("ACF data received:", acfData);

        if (acfData && acfData.acf) {
          // Extract ingredients from ACF data
          if (acfData.acf.ingredient) {
            console.log(
              "Found ingredients in ACF:",
              JSON.stringify(acfData.acf.ingredient, null, 2)
            );

            // Transform ACF ingredients to the format expected by ProductTemplate
            ingredients = acfData.acf.ingredient.map((ingredient: any) => {
              console.log("Processing ingredient:", ingredient);
              console.log("Ingredient name:", ingredient.name);

              // Return the ingredient with the full image object for flexibility
              return {
                name: ingredient.name || "",
                image: ingredient.image || "",
              };
            });

            console.log(
              "Transformed ingredients:",
              JSON.stringify(ingredients, null, 2)
            );
          }

          // Extract product info from ACF data
          if (acfData.acf.product_info) {
            console.log("Found product info in ACF:", acfData.acf.product_info);
            productInfo = acfData.acf.product_info;
          }

          // Extract icon info from ACF data
          if (acfData.acf.icon_info) {
            console.log("Found icon info in ACF:", acfData.acf.icon_info);
            iconInfo = acfData.acf.icon_info;
          }

          // Extract experience items from ACF data (checkbox items)
          if (acfData.acf.items) {
            console.log("Found experience items in ACF:", acfData.acf.items);
            experienceItems = acfData.acf.items;
          }

          // Extract detail sections from ACF data
          if (acfData.acf.details) {
            console.log("Found detail sections in ACF:", acfData.acf.details);
            details = acfData.acf.details;
          }

          // Extract bottom check items from ACF data
          if (acfData.acf.bottom_check) {
            console.log(
              "Found bottom check items in ACF:",
              acfData.acf.bottom_check
            );
            bottomCheck = acfData.acf.bottom_check;
          }

          // Extract titles for sections
          bottom_check_title = acfData.acf.bottom_check_title || undefined;
          checkboxtitle = acfData.acf.checkboxtitle || undefined;

          console.log("Available ACF fields:", Object.keys(acfData.acf));
        }
      } else {
        // Try to get error details
        const errorText = await acfResponse.text();
        console.error("ACF API error:", acfResponse.status, errorText);
      }
    } catch (acfError) {
      console.error("Error fetching ACF data for product:", acfError);
      // Continue with the product, just without ACF data
    }

    // Transform WooCommerce product data to our format
    return {
      id: productId,
      slug: product.slug,
      title: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images[0].src
          : "/figma/product-flower-rain.png",
      images: product.images ? product.images.map((img: any) => img.src) : [],
      price: formatPrice(product.price),
      regular_price: product.regular_price,
      on_sale: product.on_sale,
      description: product.short_description || "",
      full_description: product.description,
      scents: product.attributes
        ? getScentsFromAttributes(product.attributes)
        : [],
      categories: product.categories
        ? product.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          }))
        : [],
      in_stock: product.in_stock,
      price_suffix: product.price_html?.includes("ml")
        ? "per 100ml"
        : undefined,
      meta_data: product.meta_data || [],
      ingredients: ingredients, // Add the ingredients from ACF
      product_info: productInfo, // Add the product info from ACF
      icon_info: iconInfo, // Add the icon info from ACF
      experience_items: experienceItems, // Add the experience items from ACF
      details: details, // Add the detail sections from ACF
      bottom_check: bottomCheck, // Add the bottom check items from ACF
      bottom_check_title: bottom_check_title, // Add title for bottom check section
      checkboxtitle: checkboxtitle, // Add title for checkbox/experience items section
    };
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

// Helper functions
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

export function formatPrice(price: string): string {
  // Convert price to number, format with 2 decimal places, and use € symbol
  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) return "€0,00";

  // Format the price to match Figma design (€15,95)
  return `€${priceNumber.toFixed(2).replace(".", ",")}`;
}

export function getScentsFromAttributes(attributes: any[]): string[] {
  if (!attributes || !Array.isArray(attributes)) {
    return [];
  }

  // Look for scent-related attributes
  const scentAttributes = attributes.find(
    (attr) =>
      attr.name?.toLowerCase().includes("scent") ||
      attr.name?.toLowerCase().includes("geur") ||
      attr.name?.toLowerCase().includes("notes")
  );

  if (scentAttributes && scentAttributes.options) {
    return scentAttributes.options;
  }

  // Default scents if none found
  return [];
}
