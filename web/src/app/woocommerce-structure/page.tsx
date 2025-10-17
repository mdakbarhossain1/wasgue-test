"use client";

import { useEffect, useState } from "react";
import {
  fetchWooCommerceStructure,
  WooCommerceStructure,
} from "utils/woocommerce-explorer";

export default function WooCommerceStructurePage() {
  const [structure, setStructure] = useState<WooCommerceStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "categories" | "attributes" | "tags" | "products" | "urls"
  >("urls");

  useEffect(() => {
    async function loadStructure() {
      try {
        setLoading(true);
        const data = await fetchWooCommerceStructure();
        setStructure(data);
      } catch (err: any) {
        setError(err.message || "Failed to load WooCommerce structure");
      } finally {
        setLoading(false);
      }
    }

    loadStructure();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">
          WooCommerce Structuur Analyse
        </h1>
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d6ad61] border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4">WooCommerce structuur wordt opgehaald...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">
          WooCommerce Structuur Analyse
        </h1>
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">WooCommerce Structuur Analyse</h1>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 ${
            activeTab === "urls"
              ? "border-b-2 border-[#d6ad61] font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("urls")}
        >
          URL Structuur
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "categories"
              ? "border-b-2 border-[#d6ad61] font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          Categorieën
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "products"
              ? "border-b-2 border-[#d6ad61] font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Producten
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "attributes"
              ? "border-b-2 border-[#d6ad61] font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("attributes")}
        >
          Attributen
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "tags"
              ? "border-b-2 border-[#d6ad61] font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("tags")}
        >
          Tags
        </button>
      </div>

      {/* URL Structure */}
      {activeTab === "urls" && structure && (
        <div>
          <h2 className="text-xl font-semibold mb-4">URL Structuur</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                URL Patronen
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Dit zijn de gedetecteerde URL structuren voor verschillende
                entiteiten
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Product URL
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <code className="bg-gray-100 p-1 rounded">
                      {structure.urlStructure.product}
                    </code>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Categorie URL
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <code className="bg-gray-100 p-1 rounded">
                      {structure.urlStructure.category}
                    </code>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Tag URL</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <code className="bg-gray-100 p-1 rounded">
                      {structure.urlStructure.tag}
                    </code>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Attribuut URL
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <code className="bg-gray-100 p-1 rounded">
                      {structure.urlStructure.attribute}
                    </code>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">
            Aanbevolen Next.js App Router Structuur
          </h3>
          <div className="bg-gray-100 p-4 rounded-lg mb-8">
            <pre className="whitespace-pre-wrap">
              {`src/app/
  ├── ${structure.urlStructure.product.split("/")[1]}/
  │   └── [slug]/
  │       └── page.tsx            # Individuele productpagina
  │
  ├── ${structure.urlStructure.category.split("/")[1]}/
  │   └── [slug]/
  │       └── page.tsx            # Categorie pagina
  │
  ├── ${structure.urlStructure.tag.split("/")[1] || "product-tag"}/
  │   └── [slug]/
  │       └── page.tsx            # Tag pagina
  │
  └── products/
      ├── page.tsx                # Alle producten overzicht
      └── [...filters]/
          └── page.tsx            # Gefilterde producten`}
            </pre>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === "categories" && structure && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Categorieën</h2>
          <p className="mb-4 text-sm text-gray-500">
            Gevonden: {structure.categories.length} categorieën
          </p>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[600px]">
            <ul className="list-disc list-inside space-y-2">
              {structure.categories.map((category) => (
                <li key={category.id} className="mb-2">
                  <span className="font-medium">{category.name}</span>{" "}
                  <code className="text-xs">({category.slug})</code> -{" "}
                  <span className="text-gray-500 text-sm">
                    {category.count} producten
                  </span>
                  {category.children && category.children.length > 0 && (
                    <ul className="list-circle list-inside ml-6 mt-1">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <span className="font-medium">{child.name}</span>{" "}
                          <code className="text-xs">({child.slug})</code> -{" "}
                          <span className="text-gray-500 text-sm">
                            {child.count} producten
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Products */}
      {activeTab === "products" && structure && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Product Voorbeelden</h2>
          <p className="mb-4 text-sm text-gray-500">
            5 voorbeeldproducten om de structuur te analyseren
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {structure.sampleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white shadow overflow-hidden rounded-lg"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="object-contain h-40"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/figma/product-flower-rain.png";
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{product.title}</h3>
                  <p className="text-gray-500 mt-1">{product.price}</p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Slug: {product.slug}
                    </p>
                    {product.scents && product.scents.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.scents.map((scent, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs"
                          >
                            {scent}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Show product link */}
                <div className="px-4 py-2 bg-gray-50 text-xs">
                  <a
                    href={(product as any).permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Bekijk product →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {activeTab === "attributes" && structure && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Attributen</h2>
          <p className="mb-4 text-sm text-gray-500">
            Gevonden: {structure.attributes.length} attributen
          </p>
          <div className="space-y-4">
            {structure.attributes.map((attribute) => (
              <div
                key={attribute.id}
                className="bg-white shadow overflow-hidden rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg leading-6 font-medium">
                    {attribute.name}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Slug: {attribute.slug}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  {attribute.terms && attribute.terms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attribute.terms.map((term) => (
                        <span
                          key={term.id}
                          className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm"
                        >
                          {term.name}{" "}
                          <span className="text-gray-500 text-xs">
                            ({term.count})
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Geen termen gevonden voor dit attribuut
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {activeTab === "tags" && structure && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Tags</h2>
          <p className="mb-4 text-sm text-gray-500">
            Gevonden: {structure.tags.length} tags
          </p>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {structure.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm"
                  >
                    {tag.name}{" "}
                    <span className="text-gray-500 text-xs">({tag.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
