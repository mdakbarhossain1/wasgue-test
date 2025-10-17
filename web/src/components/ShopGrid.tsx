"use client";

import { useState, useEffect } from "react";
import { Product } from "types/product";
import Image from "next/image";
import Link from "next/link";

export default function ShopGrid({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: any[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Get price range from products
  useEffect(() => {
    if (initialProducts.length > 0) {
      const prices = initialProducts.map((p) => parseFloat(p.price));
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);
    }
  }, [initialProducts]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...initialProducts];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.categories?.some((cat) => cat.slug === selectedCategory)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, sortBy, initialProducts]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
          <h3 className="font-bold text-lg mb-4" style={{ color: "#814E1E" }}>
            Filters
          </h3>

          {/* Categories */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3" style={{ color: "#814E1E" }}>
              Categorieën
            </h4>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="all"
                  checked={selectedCategory === "all"}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Alle producten</span>
              </label>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.slug}
                    checked={selectedCategory === category.slug}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {category.name} ({category.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3" style={{ color: "#814E1E" }}>
              Sorteer op
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border rounded-lg"
              style={{ borderColor: "#D6AD61" }}
            >
              <option value="default">Standaard</option>
              <option value="name">Naam (A-Z)</option>
              <option value="price-low">Prijs (laag-hoog)</option>
              <option value="price-high">Prijs (hoog-laag)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} producten gevonden
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/wasparfum/${product.slug}`}
              className="group"
            >
              <div
                className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-[#D6AD61]"
                style={{ borderColor: "#E5E5E5" }}
              >
                {/* Sale badge */}
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
                <div className="relative h-[280px] bg-[#F8F6F0] flex items-center justify-center p-6">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={200}
                    height={250}
                    className="object-contain h-full w-auto transition-transform group-hover:scale-110"
                  />
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3
                    className="font-semibold text-base mb-2"
                    style={{ color: "#814E1E" }}
                  >
                    {product.title}
                  </h3>

                  {/* Categories */}
                  {product.categories && product.categories.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {product.categories[0].name}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      {product.on_sale && product.regular_price ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-gray-400 text-sm">
                            €{product.regular_price}
                          </span>
                          <span
                            className="text-xl font-bold"
                            style={{ color: "#814E1E" }}
                          >
                            €{product.price}
                          </span>
                        </div>
                      ) : (
                        <p
                          className="text-xl font-bold"
                          style={{ color: "#814E1E" }}
                        >
                          €{product.price}
                        </p>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "#D6AD61" }}>
                      ⭐ 4.9
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Geen producten gevonden met de huidige filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
