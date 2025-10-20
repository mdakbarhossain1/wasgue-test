"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "context/CartContext";
import { useAuth } from "context/AuthContext";

// Helper function to get proper image path - same approach as ProductTemplate and other components
const getProductImageSrc = (imagePath: string | undefined): string => {
  if (!imagePath) return "/figma/product-flower-rain.png";

  // If it's already a full URL from WooCommerce/WordPress, use it directly
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // If it's a local path starting with /figma/, use it directly
  if (imagePath.startsWith("/figma/")) {
    return imagePath;
  }

  // For other paths, assume it's from the backend and should be used as-is
  // This matches the approach in product-helpers.ts and woocommerce.ts
  return imagePath;
};

export default function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    remainingForFreeShipping,
    hasReachedFreeShipping,
    shippingThreshold,
    cartCount,
    addToCart,
  } = useCart();
  const { isLoggedIn, orders } = useAuth();

  const [isClosing, setIsClosing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [upsellProducts, setUpsellProducts] = useState<
    Array<{
      id: string;
      title: string;
      price: number;
      originalPrice?: number;
      image: string;
      badge?: string;
    }>
  >([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [animatedItems, setAnimatedItems] = useState<Set<string>>(new Set());
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Handle closing animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeCart();
      setIsClosing(false);
    }, 300);
  };

  // Item animation when adding to cart
  useEffect(() => {
    if (items.length > 0) {
      const latestItem = items[items.length - 1];
      const itemKey = `${latestItem.id}-${latestItem.variant}`;
      setAnimatedItems((prev) => new Set(prev).add(itemKey));
      setTimeout(() => {
        setAnimatedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 600);
    }
  }, [items.length]);

  // Alleen voorkom scrollen op mobiel, sta toe op desktop
  useEffect(() => {
    const handleScroll = () => {
      // Voorkom dat de pagina naar boven springt door evt.preventDefault()
      // niet te gebruiken op scroll events
    };

    if (isOpen) {
      // In plaats van overflow: hidden gebruiken we een class op de body
      // om beter te controleren hoe de pagina zich gedraagt
      document.body.classList.add("cart-sidebar-open");

      // Voor mobiel kunnen we overflow: hidden toevoegen
      if (window.innerWidth < 768) {
        document.body.style.overflow = "hidden";
      }

      // Voeg scroll handler toe om verspringen te voorkomen
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      document.body.classList.remove("cart-sidebar-open");
      document.body.style.overflow = "";
      window.removeEventListener("scroll", handleScroll);
    }

    return () => {
      document.body.classList.remove("cart-sidebar-open");
      document.body.style.overflow = "";
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  // Dynamic upsells based on login state and past orders
  useEffect(() => {
    const computeAndFetchUpsells = async () => {
      try {
        const hasTrialInCart = items.some(
          (i) => i.id === "1893" || /proefpakket|trial\s*pack/i.test(i.title)
        );

        // Expanded list of candidate products for better variety
        const allCandidates = [
          "335060",
          "1893",
          "334999",
          "335706",
          "44876",
          "267628",
        ];

        let candidateIds: string[] = [];

        if (!isLoggedIn) {
          // For non-logged users, show more variety
          candidateIds = allCandidates.filter(
            (id) => !items.some((ci) => ci.id === id)
          );
          // Prioritize trial pack and popular items
          if (hasTrialInCart) {
            candidateIds = ["335060", "334999"].filter(
              (id) => !items.some((ci) => ci.id === id)
            );
          }
        } else {
          // For logged users, show products they haven't ordered recently
          const orderedIds = new Set<string>();
          (orders || []).forEach((o: any) =>
            (o.items || []).forEach((it: any) => orderedIds.add(String(it.id)))
          );

          // Filter out products already in cart, but be less strict about past orders
          candidateIds = allCandidates.filter(
            (id) => !items.some((ci) => ci.id === id)
          );

          // If they've ordered everything, still show some options
          if (candidateIds.length === 0) {
            candidateIds = ["335060", "1893"].filter(
              (id) => !items.some((ci) => ci.id === id)
            );
          }
        }

        // Always ensure we have at least one candidate if cart isn't empty
        if (candidateIds.length === 0 && items.length > 0) {
          candidateIds = ["335060"]; // Fallback to popular item
        }

        if (candidateIds.length === 0) {
          setUpsellProducts([]);
          return;
        }

        const res = await fetch(
          `/api/woocommerce/products?ids=${candidateIds.join(",")}`
        );
        if (!res.ok) {
          setUpsellProducts([]);
          return;
        }
        const products = await res.json();
        const mapped = (Array.isArray(products) ? products : []).map(
          (p: any) => {
            const mappedId = String(p.id);

            // Define specific images for known upsell products
            const getUpsellProductImage = (id: string, apiImages: any[]) => {
              // Specific image overrides for upsell products
              const imageOverrides: Record<string, string> = {
                "335060":
                  "https://wasgeurtje.nl/wp-content/uploads/2025/04/wasstrips.jpg.webp", // Wasstrips
                "1893":
                  "https://wasgeurtje.nl/wp-content/uploads/2023/11/wasparfum-proefpakket-e1705177381815.jpg", // Proefpakket
                "334999":
                  "https://wasgeurtje.nl/wp-content/uploads/2023/11/wasparfum-proefpakket-e1705177381815.jpg", // Luxe Aroma
                "335706":
                  "https://wasgeurtje.nl/wp-content/uploads/2025/04/ChatGPT-Image-18-apr-2025-16_48_05.webp", // Combideal
                "44876":
                  "https://wasgeurtje.nl/wp-content/uploads/2023/10/wasparfum-accessoire.jpg", // Accessoire
                "267628":
                  "https://wasgeurtje.nl/wp-content/uploads/2023/11/wasparfum-flower-rain.jpg", // Flower Rain
              };

              // Use override if available
              if (imageOverrides[id]) {
                return imageOverrides[id];
              }

              // Otherwise use API image or fallback
              return (
                apiImages?.[0]?.src ||
                "https://wasgeurtje.nl/wp-content/uploads/2023/10/wasparfum-default.png"
              );
            };

            return {
              id: mappedId,
              title: p.name || p.title || "Product",
              price: parseFloat(p.price || p.regular_price || 0),
              originalPrice: p.sale_price
                ? parseFloat(p.regular_price || 0)
                : undefined,
              image: getUpsellProductImage(mappedId, p.images),
              badge: p.featured ? "Aanbevolen" : undefined,
            };
          }
        );
        // Limit to max 2 upsell products to keep sidebar clean
        setUpsellProducts(mapped.slice(0, 2));
      } catch {
        setUpsellProducts([]);
      }
    };

    computeAndFetchUpsells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, JSON.stringify(items), JSON.stringify(orders)]);

  if (!isOpen && !isClosing) return null;

  // Calculate shipping progress percentage
  const shippingProgress = Math.min((subtotal / shippingThreshold) * 100, 100);

  return (
    <>
      {/* Overlay with blur effect */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-[999] ${
          isOpen && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sidebar - positioned on right side */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[440px] bg-white/95 backdrop-blur-md shadow-2xl z-[1000] transition-all duration-300 cart-sidebar ${
          isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="h-full flex flex-col bg-gradient-to-br from-white via-white to-[#FFF9F0]">
          {/* Header - Compact */}
          <div className="relative px-4 py-3 bg-gradient-to-r from-[#814E1E] to-[#A66835] shadow-lg">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Winkelwagen
                  <span className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </h2>
                <p className="text-white/80 text-xs mt-0.5">Je winkelmand</p>
              </div>
              <button
                onClick={handleClose}
                className="group p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-white backdrop-blur-sm">
                <svg
                  className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="px-4 py-3">
              {/* Free Shipping Bar - Compact */}
              <div className="mb-3 p-2 bg-gradient-to-b from-white to-[#FFF9F0] rounded-lg border border-gray-100">
                {hasReachedFreeShipping ? (
                  <div className="text-center animate-in slide-in-from-top duration-500">
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-bold text-base">
                        Gratis verzending!
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      Je bestelling wordt gratis verzonden 🚚
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs mb-1.5 font-medium text-[#814E1E]">
                      Nog{" "}
                      <span className="font-bold">
                        €{remainingForFreeShipping.toFixed(2)}
                      </span>{" "}
                      voor <span className="font-bold">gratis verzending!</span>
                    </p>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FCCE4E] via-[#FFD700] to-[#D6AD61] transition-all duration-700 ease-out rounded-full"
                        style={{
                          width: `${shippingProgress}%`,
                          boxShadow: "0 1px 4px rgba(252, 206, 78, 0.4)",
                        }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm border border-[#D6AD61] flex items-center justify-center">
                          <div className="w-1 h-1 bg-[#D6AD61] rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">
                      Gratis verzending vanaf €{shippingThreshold}
                    </p>
                  </div>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#814E1E]/10 blur-3xl"></div>
                    <svg
                      className="relative w-20 h-20 mx-auto text-gray-300 mb-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2 text-lg font-medium">
                    Je winkelwagen is leeg
                  </p>
                  <p className="text-gray-400 mb-8 text-sm">
                    Tijd om wat lekkers uit te kiezen!
                  </p>
                  <button
                    onClick={handleClose}
                    className="group relative bg-gradient-to-r from-[#814e1e] to-[#A66835] text-white px-8 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold overflow-hidden">
                    <span className="relative z-10">Verder winkelen</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-2">
                    {items.map((item) => {
                      // Create a unique key that includes a variant or a fallback to ensure uniqueness
                      const itemKey = `${item.id}-${
                        item.variant ||
                        Math.random().toString(36).substring(2, 9)
                      }`;
                      const isAnimated = animatedItems.has(itemKey);
                      const isHovered = hoveredItem === itemKey;

                      return (
                        <div
                          key={itemKey}
                          className={`relative flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 ${
                            isAnimated
                              ? "animate-in slide-in-from-right duration-500"
                              : ""
                          } ${isHovered ? "shadow-lg scale-[1.02]" : ""}`}
                          onMouseEnter={() => setHoveredItem(itemKey)}
                          onMouseLeave={() => setHoveredItem(null)}>
                          <div className="relative w-16 h-16 bg-gradient-to-br from-[#F8F6F0] to-[#FFF9F0] rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={getProductImageSrc(item.image)}
                              alt={item.title}
                              fill
                              className="object-contain p-1 hover:scale-105 transition-transform duration-300"
                              unoptimized={item.image?.startsWith("http")}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#814E1E] mb-0.5 text-base">
                              {item.title}
                            </h3>
                            {item.variant && (
                              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#814E1E] rounded-full"></span>
                                {item.variant}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.variant,
                                      Math.max(0, item.quantity - 1)
                                    )
                                  }
                                  className="px-3 py-1.5 hover:bg-white transition-all duration-200 text-[#814E1E] font-bold text-base group">
                                  <span className="group-hover:scale-110 inline-block transition-transform">
                                    -
                                  </span>
                                </button>
                                <span className="px-3 py-1.5 min-w-[40px] text-center font-semibold text-[#814E1E] bg-white border-x border-gray-200">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.variant,
                                      item.quantity + 1
                                    )
                                  }
                                  className="px-3 py-1.5 hover:bg-white transition-all duration-200 text-[#814E1E] font-bold text-base group">
                                  <span className="group-hover:scale-110 inline-block transition-transform">
                                    +
                                  </span>
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#814E1E] text-lg">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </p>
                                {item.originalPrice && (
                                  <p className="text-sm text-gray-400 line-through">
                                    €
                                    {(
                                      item.originalPrice * item.quantity
                                    ).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              removeFromCart(item.id, item.variant)
                            }
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                            aria-label="Verwijder uit winkelwagen">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cross-sell Section - compact design */}
                  {upsellProducts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-bold text-sm mb-2 flex items-center text-[#814E1E]">
                        <span className="text-base mr-1.5">
                          {!hasReachedFreeShipping ? "💡" : "⭐"}
                        </span>
                        {!hasReachedFreeShipping
                          ? "Bijna gratis verzending!"
                          : "Aanraders voor jou!"}
                      </h3>
                      {upsellProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group relative flex items-center gap-2 p-2 bg-gradient-to-r from-[#FFF9F0] to-[#FFFCF5] border border-[#D6AD61]/30 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 mb-1.5">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#814E1E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                          <div className="relative w-10 h-10 bg-white rounded-md overflow-hidden shadow-sm">
                            <Image
                              src={getProductImageSrc(product.image)}
                              alt={product.title}
                              fill
                              className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                              unoptimized={product.image?.startsWith("https")}
                            />
                          </div>
                          <div className="relative flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-[#814E1E] mb-0">
                                  {product.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-bold text-[#814E1E]">
                                    €{product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-xs text-gray-500 line-through">
                                      €{product.originalPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const crossSellItem = {
                                    id: product.id,
                                    title: product.title,
                                    price: product.price,
                                    image: product.image,
                                    originalPrice: product.originalPrice,
                                  };
                                  addToCart(crossSellItem);
                                }}
                                className="group/btn relative text-white bg-gradient-to-r from-[#814E1E] to-[#A66835] hover:shadow-lg px-3 py-1.5 rounded-md transition-all duration-300 text-xs font-bold overflow-hidden">
                                <span className="relative z-10 text-nowrap">
                                  + Add
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sticky Checkout Section - Always at bottom */}
          <div className="border-t-2 border-gray-200 bg-gradient-to-br from-white via-white to-[#FFF9F0] px-4 py-3">
            {/* Trust Badges - horizontal auto-scroll */}
            <div className="mb-3">
              <div className="overflow-hidden relative">
                <div
                  className="flex animate-infinity-scroll gap-3"
                  style={{ animationPlayState: "running !important" }}>
                  {/* Create 4 identical sets for perfect seamless scrolling */}
                  {Array.from({ length: 4 }, (_, setIndex) =>
                    [
                      { icon: "🔒", text: "Veilig betalen" },
                      { icon: "⚡", text: "Vandaag verzonden" },
                      { icon: "♻️", text: "30 dagen retour" },
                      { icon: "🚚", text: "Gratis verzending" },
                      { icon: "💳", text: "iDEAL betaling" },
                      { icon: "⭐", text: "Hoge kwaliteit" },
                    ].map((badge, badgeIndex) => (
                      <div
                        key={`set-${setIndex}-badge-${badgeIndex}`}
                        className="flex items-center text-xs text-gray-600 bg-gray-50 rounded-lg p-2 whitespace-nowrap flex-shrink-0 hover:bg-gray-100 transition-colors duration-200"
                        style={{ animationPlayState: "running" }}>
                        <span className="text-sm mr-2">{badge.icon}</span>
                        <span className="font-medium">{badge.text}</span>
                      </div>
                    ))
                  ).flat()}
                </div>
              </div>
            </div>

            {/* Totaal - Compact */}
            <div className="mb-3 bg-white/50 backdrop-blur-sm p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-[#814E1E]">Totaal</span>
                <span className="text-[#814E1E]">
                  €
                  {(
                    subtotal +
                    (!hasReachedFreeShipping ? 4.95 : 0) -
                    (isPromoApplied ? subtotal * 0.1 : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Accordion Toggle - Compact */}
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 mb-3">
              <span className="text-xs font-medium text-gray-700">
                Details bekijken
              </span>
              <svg
                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                  isAccordionOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Accordion Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isAccordionOpen ? "max-h-96 mb-3" : "max-h-0"
              }`}>
              <div className="space-y-4">
                {/* Promo Code */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Kortingscode"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#814e1e] focus:ring-1 focus:ring-[#814e1e]/20 transition-all duration-200"
                    />
                    <button
                      onClick={() => {
                        if (promoCode) setIsPromoApplied(true);
                      }}
                      className="px-4 py-2 bg-white border-2 border-[#814e1e] text-[#814e1e] rounded-lg hover:bg-[#814e1e] hover:text-white transition-all duration-200 text-sm font-semibold">
                      Apply
                    </button>
                  </div>
                  {isPromoApplied && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Korting toegepast!
                    </p>
                  )}
                </div>

                {/* Breakdown */}
                <div className="space-y-2 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">Subtotaal</span>
                    <span className="text-[#814E1E] font-semibold">
                      €{subtotal.toFixed(2)}
                    </span>
                  </div>
                  {!hasReachedFreeShipping && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Verzending</span>
                      <span className="text-[#814E1E] font-semibold">
                        €4,95
                      </span>
                    </div>
                  )}
                  {isPromoApplied && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Korting (10%)</span>
                      <span>-€{(subtotal * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Checkout Button - Always Visible and Prominent */}
            <Link href="/checkout">
              <button
                className="group relative w-full bg-gradient-to-r from-[#814e1e] to-[#A66835] text-white py-3 rounded-lg hover:shadow-xl transition-all duration-300 font-semibold text-base overflow-hidden"
                onClick={() => {
                  handleClose();
                }}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Afrekenen
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </button>
            </Link>

            {/* Security Badge - minimal */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center bg-gray-50 rounded-lg py-1.5">
                <svg
                  className="w-3 h-3 mr-1 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Veilig afrekenen
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
