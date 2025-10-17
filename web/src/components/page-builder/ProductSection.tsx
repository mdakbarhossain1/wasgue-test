"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ACFProductSection, WordPressProduct } from "types/wordpress-acf";
import { useCart } from "context/CartContext";

interface ProductSectionProps {
  section: ACFProductSection & { products: WordPressProduct[] };
}

export default function ProductSection({ section }: ProductSectionProps) {
  const { section_title, products } = section;
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use cart hooks after component is mounted
  let addToCart: ((item: any) => void) | undefined;

  try {
    const cart = useCart();
    addToCart = cart.addToCart;
  } catch (error) {
    // Cart context not available yet
    console.warn("Cart context not available, cart functionality disabled");
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="woocommerce py-12 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header with 2025 Design */}
        {section_title && (
          <div className="text-center mb-12 relative">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-96 h-32 bg-gradient-to-r from-[#e9c356]/20 via-[#e9c356]/30 to-[#e9c356]/20 blur-3xl"></div>
            </div>

            {/* Title with Modern Typography */}
            <h2 className="relative md:text-[32px] text-[26px] text-transparent bg-clip-text bg-gradient-to-r from-[#1d1d1d] via-[#e9c356] to-[#1d1d1d] font-['classgarmnd_btroman',sans-serif] mb-3 mx-auto tracking-tight max-w-[550px]">
              {section_title}
            </h2>

            {/* Animated Underline */}
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-[#e9c356] animate-pulse"></div>
              <div className="w-2 h-2 bg-[#e9c356] rounded-full animate-ping"></div>
              <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-[#e9c356] animate-pulse"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 left-1/4 w-6 h-6 bg-[#e9c356]/30 rounded-full blur-xl animate-float"></div>
            <div
              className="absolute -bottom-4 right-1/4 w-8 h-8 bg-[#1d1d1d]/20 rounded-full blur-xl animate-float"
              style={{ animationDelay: "2s" }}></div>
          </div>
        )}

        {/* Products Grid - WooCommerce Style */}
        <ul className="products columns-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
          {products.map((product, index) => (
            <li
              key={`product-${product.id || index}`}
              className="product type-product text-center relative">
              {/* Product Image with Soft Edges */}
              <Link
                href={product.permalink || `/product/${product.slug}` || "#"}
                className="woocommerce-LoopProduct-link block group">
                <div className="relative aspect-square overflow-hidden">
                  {/* Gradient Background for Soft Edges */}
                  {/* <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8F6F0] to-white rounded-2xl"></div> */}

                  {/* Product Image Container with Mask */}
                  <div className="relative h-full w-full ">
                    {product.images && product.images[0] && (
                      <>
                        {/* Extra Soft Edge Mask for products with hard backgrounds */}
                        {(product.slug?.includes("proefpakket") ||
                          product.slug?.includes("wasstrips") ||
                          product.slug?.includes("cadeauset")) && (
                          <div className="absolute inset-2 bg-gradient-to-br from-white/80 via-transparent to-white/80 rounded-xl pointer-events-none z-5"></div>
                        )}

                        {/* Soft Edge Mask */}
                        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/40 pointer-events-none z-10"></div>

                        {/* Product Image */}
                        <div className="relative h-full w-full">
                          <Image
                            src={product.images[0].src}
                            alt={product.images[0].alt || product.name}
                            fill
                            className={`object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500 ${
                              product.slug?.includes("proefpakket") ||
                              product.slug?.includes("wasstrips") ||
                              product.slug?.includes("cadeauset")
                                ? "opacity-95 mix-blend-multiply"
                                : ""
                            }`}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sale Badge */}
                  {product.sale_price &&
                    product.sale_price !== product.regular_price && (
                      <span className="onsale absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-sm">
                        Sale!
                      </span>
                    )}
                </div>

                {/* Product Title */}
                <h3 className="woocommerce-loop-product__title text-[#212529] text-[17px] font-['classgarmnd_btroman',sans-serif] font-medium mt-3 mb-2">
                  {product.name}
                </h3>

                {/* Price */}
                <span className="price block text-center mb-4">
                  {product.sale_price &&
                  product.sale_price !== product.regular_price ? (
                    <>
                      <del>
                        <span className="woocommerce-Price-amount amount text-gray-400 text-sm md:text-2xl  font-light">
                          <span className="woocommerce-Price-currencySymbol">
                            €
                          </span>
                          {product.regular_price}
                        </span>
                      </del>{" "}
                      <ins className="no-underline">
                        <span className="woocommerce-Price-amount amount text-[#212529] text-sm md:text-2xl  font-light">
                          <span className="woocommerce-Price-currencySymbol">
                            €
                          </span>
                          {product.sale_price}
                        </span>
                      </ins>
                    </>
                  ) : (
                    <span className="woocommerce-Price-amount amount text-[#212529] text-sm md:text-2xl font-light">
                      <span className="woocommerce-Price-currencySymbol">
                        €
                      </span>
                      {product.price || product.regular_price}
                    </span>
                  )}
                </span>
              </Link>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  if (mounted && addToCart) {
                    addToCart({
                      id: product.id,
                      title: product.name,
                      price: parseFloat(
                        (product.price || product.regular_price || "0")
                          .replace("€", "")
                          .replace(",", ".")
                      ),
                      image:
                        product.images && product.images[0]
                          ? product.images[0].src
                          : "",
                    });
                  }
                }}
                disabled={!mounted || !addToCart}
                className={`button product_type_simple add_to_cart_button ajax_add_to_cart inline-block px-[35px] py-[10px] bg-gradient-to-r from-[#fcce4e] to-[#d6ad61] text-white text-[13px] font-extrabold text-center rounded-[30px] md:rounded relative hover:opacity-90 transition-opacity ${
                  !mounted || !addToCart ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-product_id={product.id}
                data-product_sku={product.sku || ""}
                aria-label={`"${product.name}" toevoegen aan je winkelwagen`}>
                <label className="hidden md:block ">
                  {" "}
                  Toevoegen aan winkelwagen
                </label>{" "}
                <label className="block md:hidden ">Voeg toe</label>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
