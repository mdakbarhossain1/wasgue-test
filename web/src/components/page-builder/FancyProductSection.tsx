"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
// import {
//   ACFFancyProductSection,
//   WordPressProduct,
//   WordPressImage,
// } from "@/types/wordpress-acf";
import { useCart } from "context/CartContext";
import {
  ACFFancyProductSection,
  WordPressImage,
  WordPressProduct,
} from "types/wordpress-acf";
// import { useCart } from "@/context/CartContext";
const fancyShape = "/figma/fancy_shape.png";

interface FancyProductSectionProps {
  section: ACFFancyProductSection & {
    products: WordPressProduct[];
    background: WordPressImage;
  };
}

export default function FancyProductSection({
  section,
}: FancyProductSectionProps) {
  const { background, section_title, sub_title, products, product_note } =
    section;
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
    <section
      id="fancy_product--section"
      className="woocommerce relative py-12 md:py-16 overflow-hidden"
    >
      {/* Background Image */}
      {background && background.url && (
        <div className="absolute inset-0 z-0">
          <Image
            src={background.url}
            alt={background.alt || "Background"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* <div className="absolute inset-0 bg-black/60"></div> */}
        </div>
      )}

      {/* Fallback background when no image */}
      {/* {(!background || !background.url) && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1d] via-gray-800 to-[#1d1d1d]"></div>
      )} */}

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {section_title && (
            <h2
              className="text-2xl md:text-[32px] font-medium !text-[#d7aa43] font-['classgarmnd_btroman',sans-serif]"
              style={{
                color: "#d7aa43 !important",
              }}
            >
              {section_title}
            </h2>
          )}
          {sub_title && (
            <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto mt-2">
              {sub_title}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <ul className="products columns-6 grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 list-none ">
          {products.map((product: WordPressProduct, index: number) => (
            <li
              key={`fancy-product-${product.id || index}`}
              className="product type-product text-center relative border border-[#e9c356] bg-[#0e1528] mt-[100px]  pb-10"
            >
              {/* Product Image */}
              <Link
                href={product.permalink || `/product/${product.slug}` || "#"}
                className="woocommerce-LoopProduct-link block"
              >
                <div className="relative mt-[-100px] overflow-hidden  rounded text-center">
                  {product.images && product.images[0] && (
                    <div>
                      <img src={fancyShape} alt="" className="mx-auto" />
                      <Image
                        src={product.images[0].src}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-contain p-3 !w-3/5 mx-auto"
                        // sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    </div>
                  )}

                  {/* NEW Badge */}
                  <div className="absolute top-[88px] left-1 bg-[#e9c356] text-[#1d1d1d] px-2 py-1 rounded text-xs font-bold">
                    NEW
                  </div>
                </div>

                <div></div>

                {/* Product Title */}
                <h3 className="woocommerce-loop-product__title text-white text-[15px] font-['classgarmnd_btroman',sans-serif] font-medium mt-2 mb-1">
                  {product.name}
                </h3>

                {/* Price */}
                <span className="price block text-center mb-3">
                  {product.sale_price &&
                  product.sale_price !== product.regular_price ? (
                    <>
                      <del>
                        <span className="woocommerce-Price-amount amount text-gray-300 text-lg font-light">
                          <span className="woocommerce-Price-currencySymbol">
                            €
                          </span>
                          {product.regular_price}
                        </span>
                      </del>{" "}
                      <ins className="no-underline">
                        <span className="woocommerce-Price-amount amount !text-[#e9c356] text-lg font-light">
                          <span className="woocommerce-Price-currencySymbol">
                            €
                          </span>
                          {product.sale_price}
                        </span>
                      </ins>
                    </>
                  ) : (
                    <span className="woocommerce-Price-amount amount !text-[#e9c356] text-lg font-light">
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
                className={`button product_type_simple inline-block px-4 py-2 bg-[#e9c356] text-[#1d1d1d] text-xs font-bold text-center rounded-[50px] md:rounded   ${
                  !mounted || !addToCart ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label={`"${product.name}" toevoegen aan je winkelwagen`}
              >
                <label className="md:hidden">Voeg toe</label>
                <label className="hidden md:block">
                  Toevoegen aan winkelwagen
                </label>
              </button>
            </li>
          ))}
        </ul>

        {/* Product Note */}
        {product_note && (
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
              <div className="w-3 h-3 bg-[#e9c356] rounded-full mr-3 animate-pulse"></div>
              <span className="text-white font-semibold">{product_note}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
