import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";
import { fetchProducts } from "utils/woocommerce";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collecties & Sets | Wasgeurtje",
  description:
    "Ontdek onze speciale collecties en cadeausets. Perfect als cadeau of om zelf van te genieten.",
};

// Fetch collection products
async function getCollectionProducts() {
  try {
    // Fetch products that are sets or collections
    const collectionIds = ["263341", "1893", "267628", "335706"];
    const products = await fetchProducts(collectionIds);
    return products;
  } catch (error) {
    console.error("Error fetching collection products:", error);
    return [];
  }
}

export default async function CollectionsPage() {
  const products = await getCollectionProducts();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8F6F0" }}>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#814E1E]/20 to-[#D6AD61]/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: "#814E1E" }}
          >
            Collecties & Cadeausets
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: "#814E1E", opacity: 0.8 }}
          >
            Ontdek onze zorgvuldig samengestelde collecties en cadeausets.
            Perfect voor jezelf of als cadeau voor een geliefde.
          </p>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Luxury Collection */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
              <div className="relative h-80 bg-gradient-to-br from-[#D6AD61]/20 to-[#FCCE4E]/20 flex items-center justify-center">
                <div className="text-center">
                  <h2
                    className="text-3xl font-bold mb-2"
                    style={{ color: "#814E1E" }}
                  >
                    Luxury Collection
                  </h2>
                  <p
                    className="text-lg"
                    style={{ color: "#814E1E", opacity: 0.8 }}
                  >
                    Premium geuren voor de ultieme waservaring
                  </p>
                </div>
              </div>
              <div className="p-8">
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#814E1E" }}
                >
                  De Luxe Ervaring
                </h3>
                <p className="mb-6 text-gray-600">
                  Onze premium collectie bevat exclusieve geuren geïnspireerd
                  door de beste parfumhuizen. Perfect voor wie houdt van luxe en
                  verfijning.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>3 premium wasparfums (100ml)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>Luxe geschenkverpakking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>Gratis verzending</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#814E1E" }}
                    >
                      €89,95
                    </p>
                    <p className="text-sm text-gray-500 line-through">
                      €119,85
                    </p>
                  </div>
                  <Link
                    href="/wasparfum/luxury-collection"
                    className="px-6 py-3 rounded-lg font-medium transition-all hover:transform hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
                      color: "#212529",
                    }}
                  >
                    Bekijk collectie →
                  </Link>
                </div>
              </div>
            </div>

            {/* Seasonal Collection */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
              <div className="relative h-80 bg-gradient-to-br from-[#814E1E]/20 to-[#D6AD61]/20 flex items-center justify-center">
                <div className="text-center">
                  <h2
                    className="text-3xl font-bold mb-2"
                    style={{ color: "#814E1E" }}
                  >
                    Seizoenscollectie
                  </h2>
                  <p
                    className="text-lg"
                    style={{ color: "#814E1E", opacity: 0.8 }}
                  >
                    Speciale geuren voor elk seizoen
                  </p>
                </div>
              </div>
              <div className="p-8">
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#814E1E" }}
                >
                  Vier de Seizoenen
                </h3>
                <p className="mb-6 text-gray-600">
                  Ontdek geuren die perfect passen bij elk seizoen. Van frisse
                  lentegeuren tot warme winteraroma's.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>4 seizoensgeuren (50ml)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>Limited edition verpakking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: "#D6AD61" }}>✓</span>
                    <span>Seizoenskaart met tips</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#814E1E" }}
                    >
                      €59,95
                    </p>
                    <p className="text-sm text-gray-500 line-through">€79,80</p>
                  </div>
                  <Link
                    href="/wasparfum/seasonal-collection"
                    className="px-6 py-3 rounded-lg font-medium transition-all hover:transform hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
                      color: "#212529",
                    }}
                  >
                    Bekijk collectie →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Gift Sets */}
          <div className="mb-12">
            <h2
              className="text-4xl font-bold text-center mb-12"
              style={{ color: "#814E1E" }}
            >
              Cadeausets
            </h2>
            <p
              className="text-xl text-center mb-12 max-w-3xl mx-auto"
              style={{ color: "#814E1E", opacity: 0.8 }}
            >
              Het perfecte cadeau voor elke gelegenheid. Al onze cadeausets
              worden luxe verpakt en zijn klaar om cadeau te geven.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter Set */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="h-48 bg-[#F8F6F0] rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#814E1E" }}
                >
                  Starter Cadeauset
                </h3>
                <p className="text-gray-600 mb-4">
                  Perfect om kennis te maken met onze wasparfums. Inclusief 1
                  wasparfum naar keuze.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold" style={{ color: "#814E1E" }}>
                    €24,95
                  </p>
                  <Link
                    href="/shop"
                    className="text-sm font-medium"
                    style={{ color: "#D6AD61" }}
                  >
                    Bekijk →
                  </Link>
                </div>
              </div>

              {/* Deluxe Set */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="h-48 bg-[#F8F6F0] rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-6xl">💝</span>
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#814E1E" }}
                >
                  Deluxe Cadeauset
                </h3>
                <p className="text-gray-600 mb-4">
                  Een complete set met 2 wasparfums en een luxe wasmand. Het
                  ideale cadeau!
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold" style={{ color: "#814E1E" }}>
                    €49,95
                  </p>
                  <Link
                    href="/shop"
                    className="text-sm font-medium"
                    style={{ color: "#D6AD61" }}
                  >
                    Bekijk →
                  </Link>
                </div>
              </div>

              {/* Premium Set */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow relative">
                <div
                  className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: "#814E1E" }}
                >
                  POPULAIR
                </div>
                <div className="h-48 bg-[#F8F6F0] rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-6xl">👑</span>
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#814E1E" }}
                >
                  Premium Cadeauset
                </h3>
                <p className="text-gray-600 mb-4">
                  De ultieme verwenset met 3 wasparfums, wasstrips en een luxe
                  geschenkdoos.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold" style={{ color: "#814E1E" }}>
                    €79,95
                  </p>
                  <Link
                    href="/shop"
                    className="text-sm font-medium"
                    style={{ color: "#D6AD61" }}
                  >
                    Bekijk →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Products from WooCommerce */}
          {products.length > 0 && (
            <div className="mt-16">
              <h2
                className="text-3xl font-bold mb-8"
                style={{ color: "#814E1E" }}
              >
                Alle collecties & sets
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/wasparfum/${product.slug}`}
                    className="group"
                  >
                    <div
                      className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-[#D6AD61]"
                      style={{ borderColor: "#E5E5E5" }}
                    >
                      <div className="relative h-[250px] bg-[#F8F6F0] flex items-center justify-center p-6">
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={200}
                          height={240}
                          className="object-contain h-full w-auto transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="p-5">
                        <h3
                          className="font-semibold text-base mb-2"
                          style={{ color: "#814E1E" }}
                        >
                          {product.title}
                        </h3>
                        {product.description && (
                          <p
                            className="text-sm text-gray-600 mb-3 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: product.description,
                            }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <p
                            className="text-xl font-bold"
                            style={{ color: "#814E1E" }}
                          >
                            €{product.price}
                          </p>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#D6AD61" }}
                          >
                            Bekijk details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-12 text-center text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #814E1E 0%, #D6AD61 100%)",
            }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Op zoek naar het perfecte cadeau?
            </h2>
            <p className="text-2xl mb-8 opacity-90">
              Laat ons je helpen de ideale set samen te stellen
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
              style={{ color: "#814E1E" }}
            >
              NEEM CONTACT OP
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
