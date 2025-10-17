import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";
import { getAuthHeader } from "utils/woocommerce";
import { Metadata } from "next";
import ShopGrid from "components/ShopGrid";

export const metadata: Metadata = {
  title: "Shop | Wasgeurtje",
  description:
    "Shop onze complete collectie wasparfums, wasgeurtjes en meer. Gratis verzending vanaf €40.",
};

const WOOCOMMERCE_API_URL = "https://wasgeurtje.nl/wp-json/wc/v3";

// Fetch all products
async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?per_page=100&status=publish`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.statusText}`);
    }

    const products = await response.json();

    return products.map((product: any) => ({
      id: product.id.toString(),
      slug: product.slug,
      title: product.name,
      image: product.images?.[0]?.src || "/figma/product-flower-rain.png",
      images: product.images?.map((img: any) => img.src) || [],
      price: product.price,
      regular_price: product.regular_price,
      on_sale: product.on_sale,
      description: product.short_description,
      full_description: product.description,
      categories:
        product.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })) || [],
      in_stock: product.in_stock,
      meta_data: product.meta_data || [],
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Fetch categories
async function getCategories() {
  try {
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products/categories?per_page=100&parent=0`,
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching categories: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8F6F0" }}>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: "#814E1E" }}>
            Shop
          </h1>
          <p className="text-xl" style={{ color: "#814E1E", opacity: 0.8 }}>
            Ontdek onze complete collectie wasparfums en wasgeurtjes
          </p>
        </div>

        {/* Benefits Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-1">🚚</div>
            <p className="text-sm font-medium" style={{ color: "#814E1E" }}>
              Gratis verzending vanaf €40
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-1">⏰</div>
            <p className="text-sm font-medium" style={{ color: "#814E1E" }}>
              Voor 16:00 besteld, morgen in huis
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-1">💚</div>
            <p className="text-sm font-medium" style={{ color: "#814E1E" }}>
              100% natuurlijk & vegan
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-1">🎁</div>
            <p className="text-sm font-medium" style={{ color: "#814E1E" }}>
              Punten sparen bij elke aankoop
            </p>
          </div>
        </div>

        {/* Shop Grid with Filters */}
        <ShopGrid initialProducts={products} categories={categories} />
      </div>
    </main>
  );
}
