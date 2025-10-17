"use client";

import { useState, useEffect } from "react";
import { Product } from "types/product";
import Link from "next/link";
import Image from "next/image";

// Category filter component
function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  const categories = [
    { id: "all", name: "Alle geuren", emoji: "🌺" },
    { id: "floral", name: "Bloemig", emoji: "🌸" },
    { id: "fresh", name: "Fris", emoji: "🌊" },
    { id: "sweet", name: "Zoet", emoji: "🍭" },
    { id: "woody", name: "Houtachtig", emoji: "🌳" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            selectedCategory === category.id
              ? "bg-gradient-to-r from-[#814E1E] to-[#D6AD61] text-white shadow-lg transform scale-105"
              : "bg-white border-2 border-[#D6AD61] text-[#814E1E] hover:bg-[#FFF9F0]"
          }`}
        >
          <span className="mr-2">{category.emoji}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
}

// Product card component
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/wasparfum/${product.slug}`} className="group">
      <div
        className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-[#D6AD61]"
        style={{ borderColor: "#E5E5E5" }}
      >
        {/* Badge */}
        {product.on_sale && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className="px-3 py-1 rounded-full text-white text-xs font-bold"
              style={{ backgroundColor: "#814E1E" }}
            >
              SALE
            </span>
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-[300px] bg-[#F8F6F0] flex items-center justify-center p-6">
          <Image
            src={product.image}
            alt={product.title}
            width={220}
            height={280}
            className="object-contain h-full w-auto transition-transform group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/figma/product-flower-rain.png") {
                target.src = "/figma/product-flower-rain.png";
              }
            }}
          />
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h2
            className="text-center font-semibold text-lg mb-2"
            style={{ color: "#814E1E" }}
          >
            {product.title}
          </h2>

          {/* Rating */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4 text-[#D6AD61]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">4.9</span>
          </div>

          {/* Price */}
          <div className="text-center">
            {product.on_sale && product.regular_price ? (
              <div className="flex items-center justify-center gap-2">
                <span className="line-through text-gray-400">
                  €{product.regular_price}
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#814E1E" }}
                >
                  €{product.price}
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold" style={{ color: "#814E1E" }}>
                €{product.price}
              </p>
            )}
          </div>

          {/* Quick benefits */}
          <div
            className="mt-3 flex items-center justify-center gap-2 text-xs font-medium"
            style={{ color: "#814E1E" }}
          >
            <span>✓ 40+ wasbeurten</span>
            <span>•</span>
            <span>✓ Natuurlijk</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function WasparfumProductGrid({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(initialProducts);
    } else {
      // Filter products based on category (you can implement more sophisticated filtering)
      const filtered = initialProducts.filter((product) => {
        const title = product.title.toLowerCase();
        switch (selectedCategory) {
          case "floral":
            return (
              title.includes("flower") ||
              title.includes("bloem") ||
              title.includes("rose") ||
              title.includes("jasmine")
            );
          case "fresh":
            return (
              title.includes("fresh") ||
              title.includes("ocean") ||
              title.includes("cotton") ||
              title.includes("clean")
            );
          case "sweet":
            return (
              title.includes("sweet") ||
              title.includes("vanilla") ||
              title.includes("candy") ||
              title.includes("sugar")
            );
          case "woody":
            return (
              title.includes("wood") ||
              title.includes("cedar") ||
              title.includes("sandalwood") ||
              title.includes("musk")
            );
          default:
            return true;
        }
      });
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, initialProducts]);

  return (
    <>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-800 font-medium">
            Geen producten gevonden in deze categorie.
          </p>
        </div>
      )}
    </>
  );
}
