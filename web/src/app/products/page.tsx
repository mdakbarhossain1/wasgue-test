import Link from "next/link";
import { Product } from "types/product";
import ProductCard from "components/ProductCard";

const WOOCOMMERCE_API_URL =
  process.env.WOOCOMMERCE_API_URL || "https://wasgeurtje.nl/wp-json/wc/v3";
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create authentication for WooCommerce API
const getAuthHeader = () => {
  const auth = Buffer.from(
    `${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`
  ).toString("base64");
  return `Basic ${auth}`;
};

// Helper function to format price
function formatPrice(price: string): string {
  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) return "€0,00";
  return `€${priceNumber.toFixed(2).replace(".", ",")}`;
}

// Function to get scents from product attributes
function getScentsFromAttributes(attributes: any[]): string[] {
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

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// Function to fetch top-level categories
async function getCategories(): Promise<ProductCategory[]> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products/categories?parent=0`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching categories: ${response.statusText}`);
    }

    const categories = await response.json();

    return categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category.count,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Function to fetch featured products
async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?featured=true&per_page=8`,
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
        `Error fetching featured products: ${response.statusText}`
      );
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
    }));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Function to fetch best selling products
async function getBestSellingProducts(): Promise<Product[]> {
  try {
    // WooCommerce doesn't have a direct way to fetch best selling products via the API
    // We're using the 'orderby' parameter with value 'popularity' as an approximation
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?orderby=popularity&per_page=8`,
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
    }));
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return [];
  }
}

export const metadata = {
  title: "Alle Producten | Wasgeurtje",
  description:
    "Ontdek ons assortiment van premium wasgeurtjes, wasparfums en meer voor een heerlijk ruikende was.",
};

export default async function ProductsPage() {
  // Fetch data in parallel
  const [categories, featuredProducts, bestSellingProducts] = await Promise.all(
    [getCategories(), getFeaturedProducts(), getBestSellingProducts()]
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-['EB_Garamond'] font-semibold text-[#212529] text-center">
            Onze Wasgeurtjes Collectie
          </h1>
          <p className="mt-4 text-center text-[#212529] max-w-3xl mx-auto">
            Ontdek onze premium wasparfums en wasgeurtjes voor een heerlijk
            ruikende was. Allemaal gemaakt met natuurlijke ingrediënten en
            duurzaam geproduceerd.
          </p>
        </header>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-['EB_Garamond'] font-semibold text-[#212529] mb-6">
              Categorieën
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/product-category/${category.slug}`}
                  className="bg-gradient-to-b from-[#fcce4e] to-[#d6ad61] rounded-lg p-6 text-center transition-transform hover:scale-105"
                >
                  <h3 className="text-lg font-medium text-[#212529]">
                    {category.name}
                  </h3>
                  <p className="text-sm text-[#212529] mt-1">
                    {category.count} producten
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-['EB_Garamond'] font-semibold text-[#212529] mb-6">
              Uitgelichte Producten
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Best Selling Products */}
        {bestSellingProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-['EB_Garamond'] font-semibold text-[#212529] mb-6">
              Best Sellers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
