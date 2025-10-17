"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  // images?: Array<{
  //   src: string;
  //   alt?: string;
  // }>;
  images: any;
  short_description?: string;
}

interface ProductShowcaseProps {
  sectionTitle?: string;
  products?: any[]; // Array of product objects or IDs
  backgroundColor?: string;
  textColor?: string;
}

export default function ProductShowcase({
  sectionTitle,
  products = [],
  backgroundColor = "#F8F6F0",
  textColor = "#333333",
}: ProductShowcaseProps) {
  const [productData, setProductData] = useState<Product[]>([]);
  console.log("productData: ", productData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      // Check if products are already objects or just IDs
      if (typeof products[0] === "object" && products[0].post_title) {
        // Products are already full objects from WordPress
        const transformedProducts = products.map((p) => ({
          id: p.ID,
          name: p.post_title,
          slug: p.post_name,
          price: "14.95", // Default price for now
          regular_price: "14.95",
          images: [], // Would need to fetch featured media
          short_description: p.post_excerpt,
        }));
        setProductData(transformedProducts);
      } else if (
        typeof products[0] === "number" ||
        typeof products[0] === "string"
      ) {
        // Products are IDs, fetch them
        setLoading(true);
        Promise.all(
          products.map((id) =>
            fetch(`/api/woocommerce/products/${id}`)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          )
        )
          .then((results) => {
            const validProducts = results.filter((p) => p !== null);
            setProductData(validProducts);
          })
          .finally(() => setLoading(false));
      }
    }
  }, [products]);

  const sectionStyle = {
    backgroundColor,
    color: textColor,
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(numPrice);
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24" style={sectionStyle}>
        <div className="container mx-auto px-4 max-w-7xl">
          {sectionTitle && (
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {sectionTitle}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (productData.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24" style={sectionStyle}>
      <div className="container mx-auto px-4 max-w-7xl">
        {sectionTitle && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {sectionTitle}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productData.map((product) => (
            <Link
              key={product.id}
              href={`/wasparfum/${product.slug}`}
              className="group cursor-pointer">
              <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="relative aspect-square">
                  {product.images?.[0]?.src ? (
                    <Image
                      src={product.images[0].src}
                      alt={product.images[0].alt || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {product.short_description && (
                    <div
                      className="text-sm text-gray-600 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: product.short_description,
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      {product.regular_price &&
                        product.regular_price !== product.price && (
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {formatPrice(product.regular_price)}
                          </span>
                        )}
                      <span className="text-lg font-bold text-[#D6AD61]">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <button className="bg-[#D6AD61] text-white px-4 py-2 rounded hover:bg-[#B8924E] transition-colors text-sm">
                      Bekijk
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
