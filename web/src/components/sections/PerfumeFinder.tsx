"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// Removed direct WooCommerce import - using API route instead
import { Product } from "types/product";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";
import { useCart } from "context/CartContext";

// Images
const plusIcon = "/figma/plus-icon.svg";
const lineHorizontal = "/figma/line-horizontal.svg";
const tabIndicator = "/figma/tab-indicator.svg";

// Product ID mapping for tabs
const getProductIdsByTab = (tab: string): string[] => {
  const BEST_SELLERS_IDS = ["1893", "335060", "1410", "1425"];
  const PREMIUM_IDS = ["267628", "273947", "273946", "273949"];
  const COLLECTIONS_IDS = ["1410", "1425", "267628", "273947"];

  switch (tab) {
    case "best-sellers":
      return BEST_SELLERS_IDS;
    case "premium":
      return PREMIUM_IDS;
    case "collections":
      return COLLECTIONS_IDS;
    default:
      return BEST_SELLERS_IDS;
  }
};

// Fallback product image
const fallbackProductImage = "/figma/product-flower-rain.png";

type TabType = "best-sellers" | "premium" | "collections";

interface TabProps {
  label: string;
  value: TabType;
  isActive: boolean;
  onClick: (tab: TabType) => void;
}

const Tab = ({ label, value, isActive, onClick }: TabProps) => {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  return (
    <div className="content-stretch whitespace-nowrap flex flex-col items-start justify-center relative">
      <div
        className="content-stretch flex gap-2 items-start justify-start cursor-pointer"
        onClick={() => onClick(value)}>
        <div
          className={`font-['Helvetica'] leading-[1.5] mb-2 ${
            isMobile ? "text-[16px]" : isTablet ? "text-[17px]" : "text-[18px]"
          } text-center ${
            isActive ? "font-bold text-[#814e1e]" : "text-[#212529]"
          }`}
          style={{
            width: isMobile
              ? value === "collections"
                ? "auto"
                : value === "premium"
                ? "80px"
                : "90px"
              : isTablet
              ? value === "collections"
                ? "auto"
                : value === "premium"
                ? "90px"
                : "100px"
              : value === "collections"
              ? "auto"
              : "104px",
          }}>
          {label}
        </div>
      </div>
      {isActive && (
        <div className="relative w-full h-[2px] mb-[-2px] ">
          <img src={tabIndicator} alt="" className="block size-full" />
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  // URL voor het product, bijvoorbeeld: /wasparfum/[product-slug]
  const productUrl = `/wasparfum/${product.slug}`;

  // Consistent height based on device type
  // const cardHeight = isMobile
  //   ? "h-[380px]"
  //   : isTablet
  //   ? "h-[420px]"
  //   : "h-[460px]";

  return (
    <div
      className={`bg-white relative rounded-[4px] w-full h-full border border-[#d6ad61] overflow-hidden`}>
      <div className="content-stretch flex flex-col gap-2 items-start justify-between h-full">
        {/* Product Image - Klikbaar */}
        <a href={productUrl} className="block w-full">
          <div
            className={`content-stretch flex ${
              isMobile ? "h-[140px]" : isTablet ? "h-[170px]" : "h-[200px]"
            } items-center justify-center overflow-clip w-full cursor-pointer`}>
            <div
              className={`bg-center bg-contain bg-no-repeat ${
                isMobile ? "h-[140px]" : isTablet ? "h-[170px]" : "h-[200px]"
              } w-full`}>
              <Image
                src={product.image || fallbackProductImage}
                alt={product.title}
                width={isMobile ? 160 : isTablet ? 200 : 240}
                height={isMobile ? 140 : isTablet ? 170 : 200}
                className="w-full h-full object-contain"
                priority
                onError={(e) => {
                  // Fall back to local image if remote image fails to load
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallbackProductImage) {
                    target.src = fallbackProductImage;
                  }
                }}
              />
            </div>
          </div>
        </a>

        <div className="content-stretch flex flex-col gap-4 items-start justify-between w-full flex-1">
          <div className="content-stretch flex flex-col gap-2 items-start justify-start w-full flex-1">
            <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-3 py-0 w-full flex-1">
              {/* Product Title - Klikbaar */}
              <a href={productUrl} className="block w-full">
                <div className="content-stretch flex flex-col items-center justify-start cursor-pointer pb-2 border-b border-[rgba(214,173,97,0.3)]">
                  <div
                    className={`text-[#814e1e] ${
                      isMobile
                        ? "text-[15px]"
                        : isTablet
                        ? "text-[16px]"
                        : "text-[18px]"
                    } leading-[1.5] font-['Helvetica'] text-center hover:underline`}>
                    {product.title}
                  </div>
                </div>
              </a>

              {/* <div className="h-[1px] w-full relative">
                <img src={lineHorizontal} alt="" className="block size-full" />
              </div> */}

              {/* Product Description */}
              {product.description && (
                <div
                  className={`font-['Helvetica'] ${
                    isMobile
                      ? "text-[12px] line-clamp-3"
                      : isTablet
                      ? "text-[13px] line-clamp-3"
                      : "text-[14px] line-clamp-4"
                  } text-[rgba(33,37,41,0.9)] leading-[1.5] hidden md:block truncate w-full h-20 `}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              <div
                className={`font-['Helvetica'] italic ${
                  isMobile
                    ? "text-[12px]"
                    : isTablet
                    ? "text-[13px]"
                    : "text-[14px]"
                } text-[rgba(33,37,41,0.8)] leading-[1.5] md:block`}>
                Parfum profiel
              </div>

              <div className="content-stretch gap-1 items-start justify-start flex flex-wrap">
                {(product.scents || []).map((scent, index) => (
                  <div
                    key={`${product.id}-scent-${index}`}
                    className={`bg-[rgba(214,173,97,0.1)] border border-[rgba(214,173,97,0.3)] rounded-[20px] ${
                      isMobile
                        ? "px-2 py-0"
                        : isTablet
                        ? "px-3 py-0.5"
                        : "px-4 py-0.5"
                    }`}>
                    <div
                      className={`font-['Helvetica'] ${
                        isMobile
                          ? "text-[12px]"
                          : isTablet
                          ? "text-[13px]"
                          : "text-[14px]"
                      } text-[#814e1e] leading-[1.5] whitespace-pre`}>
                      {scent}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="box-border content-stretch flex gap-2 items-center justify-between bg-[rgba(214,173,97,0.3)] px-3 py-2 w-full rounded-b-[4px] mt-auto">
              <div
                className={`font-['Helvetica'] text-[#212529] ${
                  isMobile
                    ? "text-[14px]"
                    : isTablet
                    ? "text-[15px]"
                    : "text-[16px]"
                } leading-[1.5] font-medium`}>
                {product.price}
              </div>

              <button
                className={`bg-[#fcce4e] flex gap-2 items-center justify-center p-1 rounded-[2px] ${
                  isMobile ? "size-6" : isTablet ? "size-6.5" : "size-7"
                } hover:bg-[#d6ad61] transition-colors`}
                onClick={(e) => {
                  e.preventDefault(); // Voorkom dat de klik doorgegeven wordt aan de container
                  addToCart({
                    id: product.id,
                    title: product.title,
                    price: parseFloat(
                      (product.price || "0")
                        .toString()
                        .replace("€", "")
                        .replace(",", ".")
                    ),
                    image: product.image || fallbackProductImage,
                  });
                }}>
                <img
                  src={plusIcon}
                  alt="Add to cart"
                  className="h-3 w-[11px]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PerfumeFinder() {
  const [activeTab, setActiveTab] = useState<TabType>("best-sellers");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Cache voor producten om herhaalde API-verzoeken te voorkomen
  const [cachedProducts, setCachedProducts] = useState<{
    [key in TabType]?: Product[];
  }>({});
  const [initialLoadComplete, setInitialLoadComplete] =
    useState<boolean>(false);
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  useEffect(() => {
    async function loadProducts() {
      // Als we producten in de cache hebben voor deze tab, gebruik deze
      const cachedTabProducts = cachedProducts[activeTab];
      if (cachedTabProducts && cachedTabProducts.length > 0) {
        setProducts(cachedTabProducts);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const productIds = Array.isArray(activeTab)
          ? activeTab
          : getProductIdsByTab(activeTab);

        // Use the Next.js API route with ACF data support
        const response = await fetch(
          `/api/woocommerce/products-with-acf?ids=${productIds.join(",")}`
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        let fetchedProducts = await response.json();

        // Transform API response to match expected Product interface
        fetchedProducts = fetchedProducts.map((product: any) => ({
          ...product,
          scents: product.scents || [], // ACF data only, no fallback
          price:
            typeof product.price === "number"
              ? product.price.toString()
              : product.price?.toString() || "0",
        }));

        // Alleen tonen als er daadwerkelijk producten én geuren zijn
        const productsWithScents = fetchedProducts.filter(
          (product: any) =>
            Array.isArray(product.scents) && product.scents.length > 0
        );

        if (productsWithScents.length > 0) {
          // Display up to 4 products for consistent layout
          const displayProducts = fetchedProducts.slice(0, 4);
          setProducts(displayProducts);
          // Sla de producten op in de cache
          setCachedProducts((prev) => ({
            ...prev,
            [activeTab]: displayProducts,
          }));
        } else {
          // If no products are returned, show empty state
          setProducts([]);
          setError("No products found for this category");
        }
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again later.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [activeTab, cachedProducts]);

  // Effect om alle tabbladen vooraf te laden
  useEffect(() => {
    // Voer deze functie alleen uit bij de eerste render
    async function preloadAllTabs() {
      if (initialLoadComplete) return;

      const tabsToLoad: TabType[] = ["premium", "collections"];

      // Best-sellers wordt al geladen bij de eerste render

      for (const tab of tabsToLoad) {
        try {
          console.log(`Preloading ${tab} products in background`);

          const productIds = getProductIdsByTab(tab);

          // Use the Next.js API route with ACF data support
          const response = await fetch(
            `/api/woocommerce/products-with-acf?ids=${productIds.join(",")}`
          );

          if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
          }

          let fetchedProducts = await response.json();

          // Transform API response to match expected Product interface (ACF data already included)
          fetchedProducts = fetchedProducts.map((product: any) => ({
            ...product,
            scents: product.scents || [], // ACF data only, no fallback
            price:
              typeof product.price === "number"
                ? product.price.toString()
                : product.price?.toString() || "0",
          }));

          if (fetchedProducts.length > 0) {
            const displayProducts = fetchedProducts.slice(0, 4);
            setCachedProducts((prev) => ({
              ...prev,
              [tab]: displayProducts,
            }));
          }
        } catch (err) {
          console.error(`Error preloading ${tab} products:`, err);
        }
      }

      setInitialLoadComplete(true);
    }

    // Start preloaden na 2 seconden om eerst de huidige tab te laden
    const timerId = setTimeout(() => {
      preloadAllTabs();
    }, 2000);

    return () => clearTimeout(timerId);
  }, [initialLoadComplete]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <section
      className={`bg-white ${
        isMobile ? "px-4 py-8" : isTablet ? "px-6 py-10" : "p-[72px]"
      } flex flex-col gap-6 items-center justify-center`}
      data-name="Find your perfect perfume">
      <div className="content-stretch flex flex-col gap-6 items-start justify-start w-full">
        <h2
          className={`font-['EB_Garamond'] font-semibold ${
            isMobile ? "text-[24px]" : isTablet ? "text-[28px]" : "text-[32px]"
          } text-[#212529] text-center leading-[1.2] w-full`}>
          Vind je perfecte wassparfum
        </h2>

        <div className="box-border content-stretch flex gap-4 items-center justify-center py-2 w-full  overflow-x-auto">
          <div
            className={`content-stretch flex ${
              isMobile ? "gap-5" : isTablet ? "gap-7" : "gap-10"
            } items-center justify-start border-b-[2px] border-[rgba(33,37,41,0.2)]`}>
            <Tab
              label="Best Verkocht"
              value="best-sellers"
              isActive={activeTab === "best-sellers"}
              onClick={handleTabChange}
            />

            <Tab
              label="Premium"
              value="premium"
              isActive={activeTab === "premium"}
              onClick={handleTabChange}
            />

            <Tab
              label="Collecties en Sets"
              value="collections"
              isActive={activeTab === "collections"}
              onClick={handleTabChange}
            />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-12 items-center justify-start w-full">
        <div className="content-stretch flex flex-col gap-4 items-start justify-start w-full">
          {isLoading ? (
            <div
              className={`content-stretch ${
                isMobile || isTablet ? "grid grid-cols-2" : "grid grid-cols-4"
              } ${isTablet ? "gap-4" : "gap-2"} items-stretch w-full`}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="bg-white border border-[#d6ad61] rounded-[4px] overflow-hidden animate-pulse h-[380px] sm:h-[420px] lg:h-[460px]">
                  <div className="flex flex-col">
                    <div
                      className={`bg-gray-200 ${
                        isMobile
                          ? "h-[140px]"
                          : isTablet
                          ? "h-[170px]"
                          : "h-[200px]"
                      } w-full`}></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-full mt-4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="w-full py-8 text-center text-red-500">{error}</div>
          ) : (
            <div
              className={`content-stretch ${
                isMobile || isTablet ? "grid grid-cols-2" : "grid grid-cols-4"
              } ${isTablet ? "gap-4" : "gap-2"} items-stretch w-full`}>
              {products.map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>

        <a
          href="/wasparfum"
          className={`bg-gradient-to-l from-[#d6ad61] to-[#fcce4e] h-11 px-8 rounded-[4px] flex items-center justify-center ${
            isTablet ? "mt-2" : ""
          }`}>
          <div className="font-['Helvetica'] text-[16px] text-[#212529] text-center uppercase leading-[1.5]">
            Alle wasparfums bekijken
          </div>
        </a>
      </div>
    </section>
  );
}
