import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";

// Gebruik .env variabelen voor WooCommerce API configuratie
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

interface FilterParams {
  orderby?: string;
  order?: "asc" | "desc";
  category?: string;
  tag?: string;
  attribute?: string;
  attribute_term?: string;
  min_price?: string;
  max_price?: string;
  status?: string;
  featured?: boolean;
  search?: string;
}

// Parse filter segments from URL path
function parseFilters(filterSegments: string[]): FilterParams {
  const filters: FilterParams = {};

  for (let i = 0; i < filterSegments.length; i += 2) {
    const filterType = filterSegments[i];
    const filterValue = filterSegments[i + 1];

    if (!filterValue) continue;

    switch (filterType) {
      case "orderby":
        filters.orderby = filterValue;
        break;
      case "order":
        filters.order = filterValue === "desc" ? "desc" : "asc";
        break;
      case "category":
        filters.category = filterValue;
        break;
      case "tag":
        filters.tag = filterValue;
        break;
      case "attribute":
        filters.attribute = filterValue;
        break;
      case "term":
        filters.attribute_term = filterValue;
        break;
      case "min_price":
        filters.min_price = filterValue;
        break;
      case "max_price":
        filters.max_price = filterValue;
        break;
      case "featured":
        filters.featured = filterValue === "true";
        break;
      case "search":
        filters.search = filterValue;
        break;
      default:
        break;
    }
  }

  return filters;
}

// Function to fetch filtered products
async function getFilteredProducts(filters: FilterParams): Promise<Product[]> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add filter parameters to query
    if (filters.orderby) queryParams.append("orderby", filters.orderby);
    if (filters.order) queryParams.append("order", filters.order);
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.tag) queryParams.append("tag", filters.tag);
    if (filters.attribute && filters.attribute_term) {
      queryParams.append(
        `attribute${filters.attribute}`,
        filters.attribute_term
      );
    }
    if (filters.min_price) queryParams.append("min_price", filters.min_price);
    if (filters.max_price) queryParams.append("max_price", filters.max_price);
    if (filters.featured) queryParams.append("featured", "true");
    if (filters.search) queryParams.append("search", filters.search);

    // Set pagination
    queryParams.append("per_page", "20");

    // Make API request
    const response = await fetch(
      `${WOOCOMMERCE_API_URL}/products?${queryParams.toString()}`,
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
        `Error fetching filtered products: ${response.statusText}`
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
    console.error("Error fetching filtered products:", error);
    return [];
  }
}

// Generate a human-readable title from filter params
function getFilterTitle(filters: FilterParams): string {
  let title = "Producten";

  if (filters.search) {
    return `Zoekresultaten voor "${filters.search}"`;
  }

  if (filters.featured) {
    title = "Uitgelichte Producten";
  }

  if (filters.orderby) {
    switch (filters.orderby) {
      case "popularity":
        title = "Populaire Producten";
        break;
      case "rating":
        title = "Best Beoordeelde Producten";
        break;
      case "date":
        title = "Nieuwe Producten";
        break;
      case "price":
        title =
          filters.order === "desc"
            ? "Producten (Prijs Hoog - Laag)"
            : "Producten (Prijs Laag - Hoog)";
        break;
      default:
        break;
    }
  }

  return title;
}

// Generate static metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { filters: string[] };
}) {
  const filters = parseFilters(params.filters);
  const title = getFilterTitle(filters);

  return {
    title: `${title} | Wasgeurtje`,
    description: `Ontdek onze collectie ${title.toLowerCase()} bij Wasgeurtje. Premium wasgeurtjes voor een heerlijk ruikende was.`,
  };
}

export default async function FilteredProductsPage({
  params,
}: {
  params: { filters: string[] };
}) {
  // Parse filters from URL
  const filters = parseFilters(params.filters);

  // Fetch filtered products
  const products = await getFilteredProducts(filters);

  // Get human-readable title for filters
  const filterTitle = getFilterTitle(filters);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-['EB_Garamond'] font-semibold text-[#212529]">
            {filterTitle}
          </h1>
          {filters.search && (
            <p className="mt-2 text-gray-600">
              {products.length} resultaten gevonden voor "{filters.search}"
            </p>
          )}
        </header>

        {/* Filter UI could go here */}

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/wasparfum/${product.slug}`}
                className="group">
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
              Geen producten gevonden met de geselecteerde filters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
