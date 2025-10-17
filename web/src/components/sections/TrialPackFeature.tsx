"use client";

import { useEffect, useState } from "react";
import { Product } from "types/product";
import { useMediaQuery, deviceBreakpoints } from "hooks/useMediaQuery";
import { useCart } from "context/CartContext";

// Horizontal line component
const HorizontalLine = () => (
  <div className="w-full h-[1px] bg-[#D6AD61] bg-opacity-30"></div>
);

// Note: Fetch WooCommerce product via internal API route to avoid exposing credentials client-side

// Format price to match design
function formatPrice(price: string): string {
  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) return "€0,00";
  return `€${priceNumber.toFixed(2).replace(".", ",")}`;
}

export default function TrialPackFeature() {
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  // const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  // Fetch the trial pack product (ID: 1893) via internal API
  useEffect(() => {
    const fetchTrialPack = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/woocommerce/products?ids=1893`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Error fetching trial pack: ${response.statusText}`);
        }

        const products = await response.json();
        const item = Array.isArray(products) ? products[0] : null;

        if (!item) {
          throw new Error("Product not found");
        }

        setProduct({
          id: item.id?.toString?.() || "1893",
          slug: item.slug,
          title: item.title,
          image: item.image || "/figma/trial-pack.png",
          price: formatPrice(String(item.price ?? "0")),
          scents: [],
          description: item.description || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching trial pack:", error);
        setError("Failed to load product");
        setLoading(false);
      }
    };

    fetchTrialPack();
  }, []);

  // Fallback content while loading
  if (loading) {
    return (
      <div
        className={`bg-white ${
          isMobile
            ? "px-4 py-10"
            : isTablet
            ? "px-6 py-10"
            : "px-[200px] py-[72px]"
        } flex justify-center items-center`}>
        <div className="text-center">Loading trial pack details...</div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div
        className={`bg-white ${
          isMobile
            ? "px-4 py-10"
            : isTablet
            ? "px-6 py-10"
            : "px-[200px] py-[72px]"
        } flex justify-center items-center`}>
        <div className="text-center">
          <h2
            className={`font-['EB_Garamond'] font-semibold ${
              isMobile
                ? "text-[20px]"
                : isTablet
                ? "text-[22px]"
                : "text-[24px]"
            } text-[#212529] mb-4`}>
            Laundry Perfume Trial Pack
          </h2>
          <p
            className={`text-[#212529] ${
              isMobile
                ? "text-[16px]"
                : isTablet
                ? "text-[17px]"
                : "text-[18px]"
            }`}>
            {error || "Product information unavailable"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`bg-white ${
        isMobile
          ? "px-4 py-10"
          : isTablet
          ? "px-6 py-10"
          : "px-[200px] py-[72px]"
      } ${isMobile || isTablet ? "flex flex-col" : "flex"} ${
        isMobile ? "gap-6" : isTablet ? "gap-8" : "gap-10"
      } justify-center relative rounded-[4px]`}>
      {/* Product image */}
      <div
        className={`${
          isMobile || isTablet ? "w-full" : ""
        } flex flex-row  self-stretch relative`}>
        <div
          className={`relative ${
            isMobile
              ? "w-full h-[350px]"
              : isTablet
              ? "w-full h-[360px]"
              : "w-[379px] h-[376px]"
          } overflow-hidden`}>
          <a
            href={`/wasparfum/${product.slug}`}
            className="block w-full h-full cursor-pointer">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/figma/trial-pack.png";
              }}
            />
          </a>
        </div>

        {/* Best Seller badge */}
        <div
          className={`absolute bg-[#fcce4e] px-3 py-1 rounded-[20px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] ${
            isMobile
              ? "left-5 top-5"
              : isTablet
              ? "left-5 top-5"
              : "left-5 top-5"
          }`}>
          <p className="font-['Helvetica'] text-[#212529] text-[14px] leading-[1.5] text-center">
            Best Seller
          </p>
        </div>
      </div>

      {/* Product details */}
      <div
        className={`flex flex-col ${
          isMobile ? "gap-4" : isTablet ? "gap-5" : "gap-6"
        } ${isMobile || isTablet ? "w-full" : "grow"}`}>
        <div className="flex flex-col gap-4">
          <div>
            <a
              href={`/wasparfum/${product.slug}`}
              className="block cursor-pointer hover:underline">
              <h2
                className={`font-['EB_Garamond'] font-semibold ${
                  isMobile
                    ? "text-[20px]"
                    : isTablet
                    ? "text-[22px]"
                    : "text-[24px]"
                } text-[#212529] leading-[1.2]`}>
                {product.title}
              </h2>
            </a>
          </div>

          <div
            className={`font-['Helvetica'] text-[#212529] ${
              isMobile
                ? "text-[16px]"
                : isTablet
                ? "text-[17px]"
                : "text-[18px]"
            } leading-[1.5] truncate max-w-[1040px] w-full h-10`}
            dangerouslySetInnerHTML={{
              __html:
                product.description ||
                "Not sure which fragrance to choose? Find your favorite with our best seller trial pack.",
            }}
          />

          <div className="w-full">
            <HorizontalLine />
          </div>

          <div
            className={`font-['Helvetica'] text-[#212529] ${
              isMobile
                ? "text-[14px]"
                : isTablet
                ? "text-[15px]"
                : "text-[16px]"
            } leading-[1.5]`}>
            <span className="font-bold">Includes: </span>
            <span>x5 10ml bottles</span>
          </div>

          <div
            className={`font-['Helvetica'] text-[#212529] ${
              isMobile
                ? "text-[14px]"
                : isTablet
                ? "text-[15px]"
                : "text-[16px]"
            } leading-[1.5]`}>
            <span className="font-bold">Perfumes: </span>
            <span>
              • Morning Vapor • Flower Rain • Blossom Drip • Sundance • Full
              Moon
            </span>
          </div>

          <div
            className={`font-['Helvetica'] italic text-[#212529] ${
              isMobile
                ? "text-[12px]"
                : isTablet
                ? "text-[13px]"
                : "text-[14px]"
            } leading-[1.5]`}>
            *2-4 washes per bottle, depending on your preferred scent strength.*
          </div>
        </div>

        {/* Add to cart button */}
        <div className="flex">
          <button
            className={`bg-gradient-to-l from-[#d6ad61] to-[#fcce4e] h-11 px-8 rounded-[4px] flex items-center justify-center gap-4 uppercase font-['Helvetica'] text-[#212529] text-[16px] ${
              isMobile || isTablet ? "w-full" : "w-fit"
            }`}
            onClick={() => {
              if (product) {
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: parseFloat(
                    product.price.replace("€", "").replace(",", ".")
                  ),
                  image: product.image,
                });
              }
            }}>
            <span>In winkelwagen</span>
            <span>{product.price}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
