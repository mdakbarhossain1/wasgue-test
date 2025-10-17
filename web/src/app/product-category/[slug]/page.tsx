import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Product } from "types/product";
import { fetchWpTermBySlug, yoastToNextMetadata } from "utils/wordpress-yoastseo";

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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

// Function to fetch category by slug
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products/categories?slug=${slug}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching category: ${response.statusText}`);
    }

    const categories = await response.json();

    if (!categories || categories.length === 0) {
      return null;
    }

    return categories[0];
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }
}

// Function to fetch products by category ID
async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?category=${categoryId}&per_page=12`,
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
    console.error("Error fetching products by category:", error);
    return [];
  }
}

// Types are defined inline for each function

// Generate static metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const term = await fetchWpTermBySlug('product_cat', params.slug);
    const yoastMeta = yoastToNextMetadata(term?.yoast_head_json);
    if (yoastMeta && (yoastMeta.title || yoastMeta.description)) {
      return yoastMeta as any;
    }
  } catch {}
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return {
      title: "Categorie niet gevonden | Wasgeurtje",
      description: "De categorie die je zoekt kon niet worden gevonden.",
    } as any;
  }
  return {
    title: `${category.name} | Wasgeurtje`,
    description: category.description
      ? category.description.replace(/<\/?[^>]+(>|$)/g, "")
      : `Ontdek alle ${category.name} producten bij Wasgeurtje.`,
  } as any;
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  // Fetch category data
  const category = await getCategoryBySlug(params.slug);

  // If category not found
  if (!category) {
    notFound();
  }

  // Fetch products in this category
  const products = await getProductsByCategory(category.id);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-['EB_Garamond'] font-semibold text-[#212529]">
            {category.name}
          </h1>
          {category.description && (
            <div
              className="mt-4 text-[#212529] prose"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}
        </header>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/wasparfum/${product.slug}`}
                className="group"
              >
                <div className="bg-white border border-[#d6ad61] rounded-[4px] overflow-hidden">
                  <div className="relative h-[200px] bg-white flex items-center justify-center p-4">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={160}
                      height={200}
                      className="object-contain h-full w-auto transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Fall back to local image if remote image fails to load
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/figma/product-flower-rain.png") {
                          target.src = "/figma/product-flower-rain.png";
                        }
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-center text-[#814e1e] text-base font-medium leading-[1.5] font-['Helvetica']">
                      {product.title}
                    </h2>
                    <p className="mt-2 text-center font-bold text-[#212529]">
                      {product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Geen producten gevonden in deze categorie.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
