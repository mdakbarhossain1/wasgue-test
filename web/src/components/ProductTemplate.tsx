"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";
import { useCart, CartItem } from "context/CartContext";
import { getMetaData } from "utils/product-helpers";
import Footer from "components/sections/Footer";
// No need to import EB_Garamond here as it's already defined in the root layout

export interface ProductInfoSection {
  title: string;
  content: string;
}

export interface ProductIngredient {
  name: string;
  image: string;
}

export interface ProductHighlight {
  text: string;
}

export interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: string;
  points?: number;
  sale?: boolean;
  originalPrice?: string;
  description?: string;
}

export interface ProductTemplateProps {
  product: Product;
  productInfoSections?: ProductInfoSection[];
  ingredients?: ProductIngredient[];
  highlights?: ProductHighlight[];
  relatedProducts?: RelatedProduct[];
  howItWorks?: {
    title: string;
    steps: {
      image: string;
      title: string;
      description: string;
    }[];
  };
  uspsTitle?: string;
  promises?: {
    title: string;
    items: string[];
  };
  testimonials?: {
    name: string;
    location: string;
    text: string;
    rating: number;
  }[];
}

// CheckmarkItem component for highlights and promises
const CheckmarkItem = ({ text }: { text: string }) => {
  return (
    <div className="flex items-start gap-2 mb-2">
      <span className="text-[#d6ad61] text-lg">✓</span>
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
};

// CollapsibleSection component for product information (mobile)
const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-b border-gray-300 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-0 py-5 flex items-center justify-between bg-[#F4F2EB] transition-colors"
        style={{ color: "#7B6C63" }}>
        <h3 className="text-base uppercase tracking-wider font-medium text-left">
          {title}
        </h3>
        <svg
          className={`w-5 h-5 transition-transform ${
            isOpen ? "-rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden bg-[#F4F2EB] ${
          isOpen ? "max-h-[2000px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}>
        {children}
      </div>
    </div>
  );
};

// TabsSection component for desktop tabs
const TabsSection = ({
  tabTitles,
  tabContents,
}: {
  tabTitles: string[];
  tabContents: React.ReactNode[];
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-gray-300">
        <div className="flex items-center justify-center">
          {tabTitles.map((title, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-5 text-base uppercase tracking-wider font-medium text-center border-b-2 transition-colors ${
                activeTab === index
                  ? "border-b-[#7B6C63] text-[#7B6C63]"
                  : "border-b-transparent text-[#7B6C63] opacity-60 hover:opacity-80"
              }`}>
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4" data-active-tab={activeTab}>
        {tabContents[activeTab] || <div>No content available for this tab</div>}
      </div>
    </div>
  );
};

// ProductDescription component with "meer weergeven" functionality
const ProductDescription = ({
  description,
  maxChars = 156,
}: {
  description: string;
  maxChars: number;
}) => {
  const [showMore, setShowMore] = useState(false);

  if (!description) return null;

  // Strip HTML tags for length calculation but preserve original for display
  const strippedText = description.replace(/<\/?[^>]+(>|$)/g, "");
  const isLongDescription = strippedText.length > maxChars;

  // For truncation, we need to be more careful with HTML
  const displayHTML =
    showMore || !isLongDescription
      ? description
      : `${strippedText.substring(0, maxChars)}...`;

  return (
    <div>
      <div
        className="prose prose-lg max-w-none"
        style={{ color: "#814E1E" }}
        dangerouslySetInnerHTML={{
          __html: showMore || !isLongDescription ? description : displayHTML,
        }}
      />
      {isLongDescription && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-2 text-sm font-medium flex items-center"
          style={{ color: "#D6AD61" }}>
          {showMore ? (
            <>
              Minder weergeven
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </>
          ) : (
            <>
              Meer weergeven
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Helper functie voor ingrediënten afbeeldingspaden
// There's an issue where prices are showing up in multiple places in responsive view
// This comment is added to track that we need to fix any other price displays that might be added by mistake
// in the DOM. Even though we don't see them in the source code, they appear in the UI.

const getIngredientImageSrc = (imagePath: string | any): string => {
  // 1. Als het een relatief pad is zonder bestandsnaam, gebruik de generieke afbeelding
  if (!imagePath || imagePath === "") {
    return "/figma/productpagina/default-ingredient.png";
  }

  // 2. Als het een string URL is (dit zou het geval moeten zijn na onze update in woocommerce.ts)
  if (typeof imagePath === "string") {
    // Als het een absolute URL is, gebruik deze direct
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // Voor lokale paden, gebruik direct (deze zijn al voorbereid in woocommerce.ts)
    if (imagePath.startsWith("/figma/")) {
      return imagePath;
    }

    // Voor andere strings, voorbereid als lokaal pad
    try {
      const fileName = imagePath.split("/").pop() || imagePath;
      const fullPath = `/figma/productpagina/${fileName}`;
      return fullPath;
    } catch (error) {
      return "/figma/productpagina/default-ingredient.png";
    }
  }

  // 3. Voor backward compatibility - voor het geval we toch een object krijgen
  if (typeof imagePath === "object" && imagePath !== null) {
    try {
      // Volledige ACF-API afbeeldingsstructuur zoals verkregen via acf_format=standard
      if (imagePath.url) {
        return imagePath.url;
      }

      return "/figma/productpagina/default-ingredient.png";
    } catch (error) {
      return "/figma/productpagina/default-ingredient.png";
    }
  }

  // Fallback voor onbekend type
  return "/figma/productpagina/default-ingredient.png";
};

export default function ProductTemplate({
  product,
  productInfoSections = [],
  ingredients = [],
  highlights = [],
  relatedProducts = [],
  howItWorks,
  uspsTitle = "Waarom dit product zo speciaal is",
  promises = {
    title: "Wij beloven je",
    items: [
      "Gratis verzending in NL & BE 📦",
      "Uitzonderlijke kwaliteit wasgeur",
      "Op werkdagen voor 16.00 besteld, vandaag verzonden 🚀",
      "Gemaakt van milieuvriendelijke en duurzame materialen",
    ],
  },
  testimonials = [
    {
      name: "Sarah M.",
      location: "Amsterdam",
      text: "Eindelijk een wasparfum die echt lang ruikt! Mijn kleding ruikt nog steeds heerlijk na een week in de kast.",
      rating: 5,
    },
    {
      name: "Linda K.",
      location: "Antwerpen",
      text: "Mijn man vroeg wat voor nieuwe parfum ik droeg... het was gewoon mijn verse was! Fantastisch product.",
      rating: 5,
    },
    {
      name: "Emma V.",
      location: "Rotterdam",
      text: "Als werkende moeder wil ik dat alles perfect ruikt. Dit product geeft me dat luxe gevoel elke dag.",
      rating: 5,
    },
    {
      name: "Nora B.",
      location: "Utrecht",
      text: "Ik ben zo blij dat ik dit heb ontdekt! De geur is subtiel maar blijft lang hangen. Precies wat ik zocht.",
      rating: 5,
    },
    {
      name: "Femke J.",
      location: "Den Haag",
      text: "Mijn hele familie is fan! Zelfs mijn tienerzoon vraagt nu of zijn kleding met dit wasparfum gewassen kan worden.",
      rating: 5,
    },
    {
      name: "Marieke P.",
      location: "Groningen",
      text: "Duurzaam, lang houdbaar en een heerlijke geur. Ik ben om en bestel nu elke maand.",
      rating: 5,
    },
    {
      name: "Annemiek T.",
      location: "Eindhoven",
      text: "De geur is niet overheersend maar geeft wel dat frisse gevoel dat ik zoek. Zeker een aanrader!",
      rating: 5,
    },
    {
      name: "Lotte V.",
      location: "Maastricht",
      text: "Na jaren verschillende producten te hebben geprobeerd, heb ik eindelijk de perfecte wasgeur gevonden.",
      rating: 5,
    },
    {
      name: "Iris K.",
      location: "Breda",
      text: "Mijn linnenkast ruikt nu als een luxe parfumerie. Zo blij met deze ontdekking!",
      rating: 5,
    },
    {
      name: "Sophie D.",
      location: "Nijmegen",
      text: "Ik ben erg kieskeurig met geuren, maar deze is perfect. Subtiel, fris en lang houdbaar.",
      rating: 5,
    },
    {
      name: "Julia M.",
      location: "Haarlem",
      text: "Sinds ik dit gebruik krijg ik constant complimenten over hoe fris mijn kleding ruikt. Geweldig product!",
      rating: 5,
    },
  ],
}: ProductTemplateProps) {
  const cart = useCart();
  const {
    addToCart,
    cartCount,
    subtotal,
    remainingForFreeShipping,
    hasReachedFreeShipping,
  } = cart;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [urgencyTimer, setUrgencyTimer] = useState(0);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<
    "single" | "duo" | "trio" | null
  >(null); // Start with no bundle selected
  const [selectedScents, setSelectedScents] = useState({
    scent1: "",
    scent2: "",
    scent3: "",
  });
  const [showBundleOptions, setShowBundleOptions] = useState(false); // Track whether to show any bundle options
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [imageInteractionCount, setImageInteractionCount] = useState(0);
  const [showEmotionalOverlay, setShowEmotionalOverlay] = useState(false);
  const [autoShowEmotional, setAutoShowEmotional] = useState(false);
  const [hoverDuration, setHoverDuration] = useState(0);
  const [showShippingTooltip, setShowShippingTooltip] = useState(false);
  const [shippingTooltipProduct, setShippingTooltipProduct] = useState<
    string | null
  >(null);
  // Scarcity/urgency interactive state
  const initialStockRef = useRef<number | null>(null);
  const [stockLeft, setStockLeft] = useState<number>(0);
  const [viewersNow, setViewersNow] = useState<number>(0);
  const [ordersToday, setOrdersToday] = useState<number>(0);
  const [lastOrderTime, setLastOrderTime] = useState<number>(0);
  const [showScarcityTooltip, setShowScarcityTooltip] =
    useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Get all product images
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  // Available scents for bundle selection
  const availableScents = [
    "Full Moon",
    "Blossom Drip",
    "Summer Vibes",
    "Fresh Cotton",
    "Ocean Breeze",
    "Lavender Dreams",
  ];

  // Bundle pricing - dynamic based on product price
  const basePrice = parseFloat(product.price) || 14.95;
  const bundles = {
    single: {
      name: "Single",
      price: basePrice,
      originalPrice: basePrice,
      savings: 0,
      label: "Standaard prijs",
      quantity: 1,
      perItem: basePrice,
    },
    duo: {
      name: "Duo",
      price: basePrice * 2 - 1, // €1 korting
      originalPrice: basePrice * 2,
      savings: 1.0,
      label: "POPULAIR",
      popular: true,
      quantity: 2,
      perItem: (basePrice * 2 - 1) / 2,
    },
    trio: {
      name: "Trio",
      price: basePrice * 3 * 0.89, // 11% korting
      originalPrice: basePrice * 3,
      savings: basePrice * 3 * 0.11,
      label: "BESTE WAARDE + GRATIS VERZENDING",
      bestValue: true,
      quantity: 3,
      perItem: (basePrice * 3 * 0.89) / 3,
    },
  };

  // Calculate total price based on bundle
  const getCurrentPrice = () => {
    if (!selectedBundle) return basePrice; // Default to base price if no bundle is selected
    return bundles[selectedBundle].price;
  };

  const getCurrentSavings = () => {
    if (!selectedBundle) return 0; // Default to 0 savings if no bundle is selected
    return bundles[selectedBundle].savings;
  };

  // Urgency timer effect
  useEffect(() => {
    setUrgencyTimer(Math.floor(Math.random() * 3600) + 1800); // 30-90 minutes
    const timer = setInterval(() => {
      setUrgencyTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mount flag and initialize client-only random values
  useEffect(() => {
    setIsMounted(true);

    // Create product-specific localStorage keys to ensure different values per product
    const productId = product.id || product.slug || "default";
    const stockKey = `stockLeft_${productId}`;
    const viewersKey = `viewersNow_${productId}`;
    const ordersKey = `ordersToday_${productId}`;
    const lastOrderTimeKey = `lastOrderTime_${productId}`;

    // Get stored values from localStorage or generate new ones
    const storedDate = localStorage.getItem("lastVisitDate");
    const today = new Date().toDateString();
    const isNewDay = storedDate !== today;

    // Get existing orders count before potentially resetting stock
    const existingOrders = localStorage.getItem(ordersKey);
    let ordersCount = existingOrders ? parseInt(existingOrders, 10) : 0;

    // Reset values if it's a new day or first visit, but preserve order counts
    if (isNewDay) {
      localStorage.setItem("lastVisitDate", today);

      // Generate new random values - starting with higher stock
      // Use product ID as part of the random seed to ensure different products have different values
      const productSeed = productId
        .toString()
        .split("")
        .reduce((a, b) => a + b.charCodeAt(0), 0);
      const randomOffset = productSeed % 10; // 0-9 offset based on product ID

      // Calculate maximum stock as 30% of the potential maximum to maintain high urgency
      const maxPossibleStock = 25 + 10; // Maximum possible from the random formula
      const maxStock = Math.floor(maxPossibleStock * 0.3); // 30% of maximum

      // Generate new stock between 20-30% of maximum possible
      const minStock = Math.floor(maxPossibleStock * 0.2);
      const initStock =
        Math.floor(Math.random() * (maxStock - minStock + 1)) + minStock;

      initialStockRef.current = initStock;
      setStockLeft(initStock);

      // More varied viewer counts - also product-specific
      const viewers = Math.floor(Math.random() * 20) + 10 + (randomOffset % 5); // 10-34 (varies by product)
      setViewersNow(viewers);

      // If we have existing orders, keep them and add some more
      // If no existing orders, start with some initial orders
      if (ordersCount > 0) {
        // Add 5-15 more orders to existing count for the new day
        const additionalOrders = Math.floor(Math.random() * 11) + 5; // 5-15 additional orders
        ordersCount += additionalOrders;
      } else {
        // Start with some initial orders - also product-specific
        ordersCount = Math.floor(Math.random() * 6) + 8 + (randomOffset % 3); // 8-16 (varies by product)
      }

      setOrdersToday(ordersCount);

      // Store the new values with product-specific keys
      localStorage.setItem(stockKey, initStock.toString());
      localStorage.setItem(viewersKey, viewers.toString());
      localStorage.setItem(ordersKey, ordersCount.toString());
      localStorage.setItem(lastOrderTimeKey, Date.now().toString());
    } else {
      // Use stored values or generate new ones if not available
      const storedStock = localStorage.getItem(stockKey);
      const storedViewers = localStorage.getItem(viewersKey);
      const storedOrders = localStorage.getItem(ordersKey);
      const storedOrderTime = localStorage.getItem(lastOrderTimeKey);

      // Use product ID as part of the random seed
      const productSeed = productId
        .toString()
        .split("")
        .reduce((a, b) => a + b.charCodeAt(0), 0);
      const randomOffset = productSeed % 10; // 0-9 offset based on product ID

      if (storedStock) {
        const parsedStock = parseInt(storedStock, 10);
        // Force reset if stock is too low (less than 10)
        if (parsedStock < 10) {
          // Calculate maximum stock as 30% of the potential maximum to maintain high urgency
          const maxPossibleStock = 25 + 10; // Maximum possible from the random formula
          const maxStock = Math.floor(maxPossibleStock * 0.3); // 30% of maximum

          // Generate new stock between 20-30% of maximum possible
          const minStock = Math.floor(maxPossibleStock * 0.2);
          const initStock =
            Math.floor(Math.random() * (maxStock - minStock + 1)) + minStock;

          initialStockRef.current = initStock;
          setStockLeft(initStock);
          localStorage.setItem(stockKey, initStock.toString());
          console.log(
            `Stock was too low for ${productId}, reset to:`,
            initStock
          );
        } else {
          initialStockRef.current = parsedStock;
          setStockLeft(parsedStock);
        }
      } else {
        // Calculate maximum stock as 30% of the potential maximum to maintain high urgency
        const maxPossibleStock = 25 + 10; // Maximum possible from the random formula
        const maxStock = Math.floor(maxPossibleStock * 0.3); // 30% of maximum

        // Generate new stock between 20-30% of maximum possible
        const minStock = Math.floor(maxPossibleStock * 0.2);
        const initStock =
          Math.floor(Math.random() * (maxStock - minStock + 1)) + minStock;

        initialStockRef.current = initStock;
        setStockLeft(initStock);
        localStorage.setItem(stockKey, initStock.toString());
      }

      if (storedViewers) {
        setViewersNow(parseInt(storedViewers, 10));
      } else {
        const viewers =
          Math.floor(Math.random() * 20) + 10 + (randomOffset % 5); // 10-34 (varies by product)
        setViewersNow(viewers);
        localStorage.setItem(viewersKey, viewers.toString());
      }

      if (storedOrders) {
        setOrdersToday(parseInt(storedOrders, 10));
      } else {
        const initialOrders =
          Math.floor(Math.random() * 6) + 8 + (randomOffset % 3); // 8-16 (varies by product)
        setOrdersToday(initialOrders);
        localStorage.setItem(ordersKey, initialOrders.toString());
      }

      if (storedOrderTime) {
        setLastOrderTime(parseInt(storedOrderTime, 10));
      } else {
        setLastOrderTime(Date.now());
        localStorage.setItem(lastOrderTimeKey, Date.now().toString());
      }
    }
  }, [product.id, product.slug]);

  // Simulate live viewers fluctuations
  useEffect(() => {
    // Create product-specific localStorage key
    const productId = product.id || product.slug || "default";
    const viewersKey = `viewersNow_${productId}`;

    const interval = setInterval(() => {
      setViewersNow((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3..+3 (more variation)
        const next = prev + delta;
        // Wider range for viewer count (min 5, max 60)
        const newValue = Math.min(60, Math.max(5, next));

        // Update localStorage with new value using product-specific key
        localStorage.setItem(viewersKey, newValue.toString());

        return newValue;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [product.id, product.slug]);

  // Simulate natural order increases and stock decreases over time
  useEffect(() => {
    if (!isMounted) return;

    // Create product-specific localStorage keys
    const productId = product.id || product.slug || "default";
    const stockKey = `stockLeft_${productId}`;
    const ordersKey = `ordersToday_${productId}`;
    const lastOrderTimeKey = `lastOrderTime_${productId}`;

    // Function to determine if enough time has passed to add new order
    // Average time between orders: 25-90 seconds (will vary naturally)
    const shouldAddOrder = () => {
      const now = Date.now();
      const minTimeGap = 25000; // Minimum 25 seconds between orders
      const randomAddition = Math.floor(Math.random() * 65000); // Random addition up to 65 seconds
      const timeGap = minTimeGap + randomAddition;

      // Check if enough time has passed since last order
      if (now - lastOrderTime > timeGap) {
        return true;
      }
      return false;
    };

    // Check every 10 seconds if we should add a new order
    const orderInterval = setInterval(() => {
      if (shouldAddOrder()) {
        // Add 1-2 orders at a time
        const newOrders = Math.floor(Math.random() * 2) + 1;

        // Update orders count
        setOrdersToday((prev) => {
          const newValue = prev + newOrders;
          localStorage.setItem(ordersKey, newValue.toString());
          return newValue;
        });

        // Update last order time
        setLastOrderTime(Date.now());
        localStorage.setItem(lastOrderTimeKey, Date.now().toString());

        // Also decrease stock if still above minimum
        setStockLeft((prev) => {
          const newValue = Math.max(5, prev - newOrders);
          localStorage.setItem(stockKey, newValue.toString());
          return newValue;
        });
      }
    }, 10000);

    return () => clearInterval(orderInterval);
  }, [isMounted, lastOrderTime, product.id, product.slug]);

  // Auto-scroll effect for testimonials
  useEffect(() => {
    const container = document.getElementById("testimonial-container");
    const slider = document.getElementById("testimonial-slider");

    if (container && slider) {
      let scrollAmount = 0;
      let isHovering = false;

      // Set scroll speed (lower = slower)
      const scrollSpeed = 0.5;

      // Pause on hover
      container.addEventListener("mouseenter", () => {
        isHovering = true;
      });
      container.addEventListener("mouseleave", () => {
        isHovering = false;
      });

      // Auto-scroll animation
      const autoScroll = () => {
        if (container && slider && !isHovering) {
          scrollAmount += scrollSpeed;

          // Reset when reaching the end
          if (scrollAmount >= slider.scrollWidth - container.clientWidth) {
            // Smooth reset to beginning
            scrollAmount = 0;
            container.scrollTo({ left: 0, behavior: "auto" });
          } else {
            container.scrollLeft = scrollAmount;
          }
        }
        requestAnimationFrame(autoScroll);
      };

      // Start auto-scroll
      const animation = requestAnimationFrame(autoScroll);

      // Cleanup
      return () => {
        cancelAnimationFrame(animation);
        if (container) {
          container.removeEventListener("mouseenter", () => {
            isHovering = true;
          });
          container.removeEventListener("mouseleave", () => {
            isHovering = false;
          });
        }
      };
    }
  }, []);

  // Sticky elements scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyCart(scrollPosition > 800);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-show emotional elements after page load - only 50.000+ customers message
  useEffect(() => {
    // Show bestseller badge immediately
    setShowEmotionalOverlay(true);

    // Show 50.000+ customers message after 2 seconds
    const timer = setTimeout(() => {
      setAutoShowEmotional(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Free shipping progress bar scroll effect - hide on scroll up, show on scroll down
  const [showShippingBar, setShowShippingBar] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  useEffect(() => {
    // Clear any existing listeners during re-renders
    window.removeEventListener("scroll", handleScroll);

    // Define scroll handler within the effect to have access to the latest state
    function handleScroll() {
      const currentScrollPosition = window.scrollY;

      // At top of page, always show
      if (currentScrollPosition <= 0) {
        setShowShippingBar(true);
      }
      // Scrolling down - hide the bar
      else if (currentScrollPosition > lastScrollPosition + 5) {
        // Add threshold to prevent flickering
        setShowShippingBar(false);
      }
      // Scrolling up - show the bar
      else if (lastScrollPosition > currentScrollPosition + 5) {
        // Add threshold to prevent flickering
        setShowShippingBar(true);
      }

      // Update last scroll position
      setLastScrollPosition(currentScrollPosition);
    }

    // Add the event listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollPosition]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(allImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex =
      currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(allImages[prevIndex]);
  };

  // Add to cart handler
  const handleAddToCart = () => {
    // Create product-specific localStorage keys
    const productId = product.id || product.slug || "default";
    const stockKey = `stockLeft_${productId}`;
    const ordersKey = `ordersToday_${productId}`;
    const lastOrderTimeKey = `lastOrderTime_${productId}`;

    // If no bundle is selected, use the single bundle as default
    if (!selectedBundle) {
      addToCart({
        id: product.id,
        title: product.title,
        price: basePrice,
        image: product.image,
      });
      // Ensure stock never goes below 5
      setStockLeft((prev) => Math.max(5, prev - 1));

      // Update orders count when user makes a purchase
      setOrdersToday((prev) => {
        const newValue = prev + 1;
        localStorage.setItem(ordersKey, newValue.toString());
        return newValue;
      });

      // Update last order time
      setLastOrderTime(Date.now());
      localStorage.setItem(lastOrderTimeKey, Date.now().toString());

      return;
    }

    const bundleInfo = bundles[selectedBundle];

    // Add single product with correct quantity for bundle
    const cartItem: CartItem = {
      id: product.id,
      title: product.title,
      price: bundleInfo.perItem,
      image: product.image,
      quantity: bundleInfo.quantity,
    };
    addToCart(cartItem);
    // Ensure stock never goes below 5
    setStockLeft((prev) => {
      const newValue = Math.max(5, prev - bundleInfo.quantity);
      localStorage.setItem(stockKey, newValue.toString());
      return newValue;
    });

    // Update orders count when user makes a purchase
    setOrdersToday((prev) => {
      const newValue = prev + bundleInfo.quantity;
      localStorage.setItem(ordersKey, newValue.toString());
      return newValue;
    });

    // Update last order time
    setLastOrderTime(Date.now());
    localStorage.setItem(lastOrderTimeKey, Date.now().toString());
  };

  return (
    <main
      className={`pt-body font-eb-garamond min-h-screen transition-all duration-300 ${
        cartCount > 0 ||
        (selectedBundle !== null && selectedBundle !== "single")
          ? "pt-[110px]"
          : "pt-[40px]"
      }`}
      style={{ backgroundColor: "#F8F6F0" }}>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(252, 206, 78, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 10px 5px rgba(252, 206, 78, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(252, 206, 78, 0);
          }
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Standardize paragraph text styling across the template (exclude titles) */}
      <style jsx>{`
        :global(.pt-body p) {
          color: #333333 !important;
          font-size: 18px !important;
          line-height: 1.625 !important;
        }
        :global(.accordion-content p) {
          color: #814e1e !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          margin-bottom: 16px !important;
        }
        :global(
            .accordion-content h1,
            .accordion-content h2,
            .accordion-content h3
          ) {
          color: #814e1e !important;
          font-weight: 600 !important;
          margin-bottom: 12px !important;
          margin-top: 20px !important;
        }
        :global(.accordion-content h1) {
          font-size: 24px !important;
        }
        :global(.accordion-content h2) {
          font-size: 20px !important;
        }
        :global(.accordion-content h3) {
          font-size: 18px !important;
        }
        :global(.accordion-content ul, .accordion-content ol) {
          color: #814e1e !important;
          margin: 16px 0 !important;
          padding-left: 20px !important;
        }
        :global(.accordion-content li) {
          margin-bottom: 8px !important;
          line-height: 1.6 !important;
        }
        :global(.accordion-content strong, .accordion-content b) {
          color: #814e1e !important;
          font-weight: 600 !important;
        }
        :global(.prose p) {
          color: #814e1e !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          margin-bottom: 16px !important;
        }
        @media (min-width: 768px) {
          :global(.pt-body p) {
            font-size: 20px !important;
          }
          :global(.accordion-content p) {
            font-size: 18px !important;
          }
          :global(.prose p) {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* Free Shipping Progress Bar - Only shown when cart has items or bundle is selected */}
      {(cartCount > 0 ||
        (selectedBundle !== null && selectedBundle !== "single")) && (
        <div
          id="shipping-progress-bar"
          className="bg-white shadow-sm py-2 px-4 transition-transform duration-300 z-50"
          style={{
            position: "fixed",
            top: "86px" /* Position it directly under the header */,
            left: 0,
            right: 0,
            width: "100%",
            transform: showShippingBar ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.3s ease",
            zIndex: 49 /* Make sure it's below the header z-index */,
          }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: "#814E1E" }}>
                {selectedBundle === "trio" || hasReachedFreeShipping
                  ? "🎉 Gefeliciteerd! Je krijgt GRATIS verzending!"
                  : `💰 Nog €${remainingForFreeShipping
                      .toFixed(2)
                      .replace(".", ",")} tot gratis verzending`}
              </span>
              <div className="flex items-center space-x-2">
                {!hasReachedFreeShipping && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[#FCCE4E] text-[#814E1E] font-bold animate-pulse">
                    BESPAAR €6,95
                  </span>
                )}
                <span
                  className="text-sm font-bold"
                  style={{ color: "#D6AD61" }}>
                  Gratis vanaf €40
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${Math.min((subtotal / 40) * 100, 100)}%`,
                  background:
                    hasReachedFreeShipping || selectedBundle === "trio"
                      ? "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)"
                      : "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)",
                }}>
                {selectedBundle === "trio" && (
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Cart - Hidden when cart sidebar is open */}
      {showStickyCart && !cart.isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-[9999] py-3 px-4"
          style={{ borderColor: "#D6AD61" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src={product.image}
                alt={product.title}
                width={50}
                height={50}
                className="rounded"
              />
              <div>
                <h3 className="font-medium text-sm text-[#814E1E]">
                  {product.title}
                </h3>
                <p className="text-lg font-bold text-[#814E1E]">
                  €{getCurrentPrice().toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              className="text-black px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
              style={{
                background: "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
              }}>
              NU BESTELLEN
            </button>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile Product Rating & Title - Only shown on mobile screens */}
        <div className="block lg:hidden mb-6">
          {/* Stars first on mobile */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-5 h-5 text-[#d6ad61]"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <span className="text-sm text-black">9.8 uit 1400+ reviews</span>
            <img src="/trustpilot-logo.svg" alt="Trustpilot" className="h-5" />
          </div>

          <div className="text-sm uppercase tracking-wider mb-2 text-black">
            {product.categories && product.categories.length > 0
              ? product.categories[0].name
              : "Premium Wasparfum"}
          </div>
          <h1 className="text-[22px] mb-2 text-black font-semibold tracking-normal leading-normal font-eb-garamond">
            {product.title}
          </h1>
          <p
            className="mb-3"
            style={{
              color: "#212529",
              fontFamily: "Jost",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "100%",
              letterSpacing: "0%",
            }}>
            Speciaal ontwikkeld voor wie elke wasbeurt wil omtoveren tot een
            verfijnde geurervaring.
          </p>
        </div>

        {/* SECTION 01 START: Hero Section (Product Images & Main Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Product Image Slider */}
          <div className="relative">
            {/* Main Image with Interactive CRO Effects */}
            <div
              className="relative aspect-square rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group"
              style={{ backgroundColor: "#F8F6F0" }}>
              {/* Removed Dynamic Background Gradient */}

              {/* Bestseller Badge with Pulse */}
              <div
                className="absolute top-4 left-4 text-white px-3 py-1 rounded-full text-sm font-bold z-10 transition-all duration-300"
                style={{ backgroundColor: "#814E1E" }}>
                BESTSELLER
              </div>

              {/* Emotional Trust Badge */}
              {showEmotionalOverlay && (
                <div className="absolute top-4 right-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-lg z-20 animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💕</span>
                    <div>
                      <p className="text-xs font-bold text-[#814E1E]">
                        50.000+ vrouwen
                      </p>
                      <p className="text-xs text-[#814E1E]">zijn verliefd!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Product Image */}
              <div className="relative w-full h-full p-12">
                <Image
                  src={selectedImage}
                  alt={product.title}
                  fill
                  className="object-contain lg:!object-scale-down lg:!w-[80%] lg:!h-[80%] lg:!left-[10%] lg:!top-[10%]"
                  priority
                />
              </div>

              {/* Slider Navigation Buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity z-10"
                    style={{ backgroundColor: "#814E1E" }}>
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity z-10"
                    style={{ backgroundColor: "#814E1E" }}>
                    →
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setSelectedImage(allImages[index]);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "opacity-100"
                          : "opacity-50"
                      }`}
                      style={{ backgroundColor: "#814E1E" }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* USPs under product image - Use icon_info from ACF if available */}
            <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
              {product.icon_info && product.icon_info.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {product.icon_info.map((info, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {info.icon && info.icon.url ? (
                        <Image
                          src={info.icon.url}
                          alt={info.icon.alt || info.text_1}
                          width={20}
                          height={20}
                          className="object-contain"
                          unoptimized={true} // Since URL is external
                        />
                      ) : (
                        <span className="text-lg" style={{ color: "#D6AD61" }}>
                          ✓
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-base font-medium text-black">
                          {info.text_1}
                        </span>
                        <span className="text-base font-medium text-black">
                          {info.text_2}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback to default USPs
                <div className="grid grid-cols-2 gap-4 p-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl" style={{ color: "#D6AD61" }}>
                      ✓
                    </span>
                    <span className="text-base md:text-lg font-medium text-black">
                      40+ wasbeurten
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl" style={{ color: "#D6AD61" }}>
                      ✓
                    </span>
                    <span className="text-base md:text-lg font-medium text-black">
                      100% natuurlijk
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl" style={{ color: "#D6AD61" }}>
                      ✓
                    </span>
                    <span className="text-base md:text-lg font-medium text-black">
                      Hypoallergeen
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl" style={{ color: "#D6AD61" }}>
                      ✓
                    </span>
                    <span className="text-base md:text-lg font-medium text-black">
                      6 weken geur
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Price Display - Always shown on mobile */}
            <div className="mt-4 block lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#000000" }}>
                    {basePrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="bg-[#F8F6F0] px-4 py-1.5 rounded-full border border-[#D6AD61] flex-grow text-center">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#814E1E" }}>
                    Slechts {Math.round((basePrice / 40) * 100)} cent per
                    wasbeurt
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info with Bundle Builder */}
          <div className="space-y-4">
            {/* Product Title & Category - Only visible on desktop */}
            <div className="hidden lg:block">
              <div className="flex items-center mb-2">
                <div className="text-sm uppercase tracking-wider text-black mr-4">
                  {product.categories && product.categories.length > 0
                    ? product.categories[0].name
                    : "Premium Wasparfum"}
                </div>
                {/* Stars next to WASPARFUM on desktop */}
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-5 h-5 text-[#d6ad61]"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-black">
                    9.8 uit 1400+ reviews
                  </span>
                  <img
                    src="/trustpilot-logo.svg"
                    alt="Trustpilot"
                    className="h-5"
                  />
                </div>
              </div>
              <h1 className="text-[22px] mb-2 text-black font-semibold tracking-normal leading-normal font-eb-garamond">
                {product.title}
              </h1>
              <p
                className="mb-3"
                style={{
                  color: "#212529",
                  fontFamily: "Jost",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "100%",
                  letterSpacing: "0%",
                }}>
                Speciaal ontwikkeld voor wie elke wasbeurt wil omtoveren tot een
                verfijnde geurervaring.
              </p>
            </div>

            {/* Responsive sections that change order on mobile */}
            <div className="block lg:flex lg:flex-col">
              {/* Scarcity & Urgency - First on mobile, fifth on desktop */}
              <div className="order-1 lg:order-5 py-3 mb-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-bold text-base"
                    style={{ color: "#814E1E" }}>
                    🔥 POPULAIR PRODUCT
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "#814E1E" }}>
                      {stockLeft} op voorraad
                    </span>
                    <button
                      aria-label="Toelichting voorraad"
                      onClick={() => setShowScarcityTooltip((v) => !v)}
                      className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ color: "#814E1E", border: "1px solid #814E1E" }}>
                      i
                    </button>
                  </div>
                </div>
                <div
                  className="w-full rounded-full h-2 mb-2 overflow-hidden cursor-pointer"
                  style={{ backgroundColor: "rgba(129, 78, 30, 0.1)" }}
                  onMouseEnter={() => setShowScarcityTooltip(true)}
                  onMouseLeave={() => setShowScarcityTooltip(false)}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        !isMounted || !initialStockRef.current
                          ? 0
                          : Math.max(
                              8,
                              Math.min(
                                30,
                                Math.round(
                                  (stockLeft /
                                    Math.max(1, initialStockRef.current)) *
                                    100
                                )
                              )
                            )
                      }%`,
                      background:
                        "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: "#814E1E" }}>
                    👀 {isMounted ? viewersNow : 0} bekijken dit nu
                  </p>
                  <p className="text-sm" style={{ color: "#814E1E" }}>
                    ⚡ {isMounted ? ordersToday : 0} vrouwen bestelden vandaag
                  </p>
                </div>

                <div className="flex items-center mt-3">
                  <div className="flex items-center justify-center bg-green-500 text-white rounded-full w-4 h-4 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    Op voorraad - Vandaag verzonden bij bestelling voor 16:00
                  </span>
                </div>

                {showScarcityTooltip && (
                  <div
                    className="absolute z-20 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white border rounded-md shadow-md px-3 py-2 text-xs"
                    style={{ borderColor: "#D6AD61", color: "#814E1E" }}>
                    {isMounted && initialStockRef.current !== null ? (
                      <>
                        Populair product! Al {ordersToday} keer verkocht
                        vandaag. Nog {stockLeft} op voorraad.
                      </>
                    ) : (
                      <>Bezig met laden…</>
                    )}
                  </div>
                )}
              </div>

              {/* Bundle Builder Section - Second on mobile, third on desktop */}
              <div
                className="order-2 lg:order-3 bg-white rounded-xl p-4 shadow-sm border mb-4"
                style={{ borderColor: "#D6AD61" }}>
                <div className="flex justify-between items-center">
                  <h3
                    className="font-bold text-lg"
                    style={{ color: "#814E1E" }}>
                    BUNDEL & BESPAAR
                  </h3>
                  {/* Toggle button for showing/hiding bundle options */}
                  <button
                    onClick={() => {
                      const newValue = !showBundleOptions;
                      setShowBundleOptions(newValue);
                      if (!newValue) {
                        // When hiding the options, clear the selection
                        setSelectedBundle(null);
                      }
                    }}
                    className="flex items-center text-sm font-medium py-2 px-3 rounded-full transition-all hover:bg-[#FFF9F0]"
                    style={{ color: "#D6AD61", border: "1px solid #D6AD61" }}>
                    {showBundleOptions ? "Verberg opties" : "Meer opties"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 ml-1 transition-transform ${
                        showBundleOptions ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Bundle Options - Only show when showBundleOptions is true */}
                {showBundleOptions &&
                  (() => {
                    // When bundle options are shown, automatically select 'single' if nothing is selected
                    if (selectedBundle === null) {
                      setSelectedBundle("single");
                    }
                    return (
                      <div className="space-y-3 mt-4">
                        {/* Single Option */}
                        <label
                          className={`block cursor-pointer rounded-lg border-2 p-4 transition-all ${
                            selectedBundle === "single"
                              ? "border-[#D6AD61] bg-[#FFF9F0]"
                              : "border-gray-200 hover:border-[#D6AD61]"
                          }`}>
                          <input
                            type="radio"
                            name="bundle"
                            value="single"
                            checked={selectedBundle === "single"}
                            onChange={(e) =>
                              setSelectedBundle(
                                e.target.value as "single" | "duo" | "trio"
                              )
                            }
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedBundle === "single"
                                    ? "border-[#814E1E]"
                                    : "border-gray-400"
                                }`}>
                                {selectedBundle === "single" && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: "#814E1E",
                                    }}></div>
                                )}
                              </div>
                              <div>
                                <span
                                  className="font-medium"
                                  style={{ color: "#814E1E" }}>
                                  Single
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  Standaard prijs
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className="text-xl font-bold"
                                style={{ color: "#814E1E" }}>
                                €{basePrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Duo Option */}
                        <label
                          className={`block cursor-pointer rounded-lg border-2 p-4 transition-all relative ${
                            selectedBundle === "duo"
                              ? "border-[#D6AD61] bg-[#FFF9F0]"
                              : "border-gray-200 hover:border-[#D6AD61]"
                          }`}>
                          <div
                            className="absolute -top-3 left-4 px-3 py-1 text-xs font-bold text-white rounded-full"
                            style={{ backgroundColor: "#D6AD61" }}>
                            POPULAIR
                          </div>
                          <input
                            type="radio"
                            name="bundle"
                            value="duo"
                            checked={selectedBundle === "duo"}
                            onChange={(e) =>
                              setSelectedBundle(
                                e.target.value as "single" | "duo" | "trio"
                              )
                            }
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedBundle === "duo"
                                    ? "border-[#814E1E]"
                                    : "border-gray-400"
                                }`}>
                                {selectedBundle === "duo" && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: "#814E1E",
                                    }}></div>
                                )}
                              </div>
                              <div>
                                <span
                                  className="font-medium"
                                  style={{ color: "#814E1E" }}>
                                  Duo
                                </span>
                                <span
                                  className="text-sm ml-2"
                                  style={{ color: "#D6AD61" }}>
                                  Bespaar €1,00
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className="text-xl font-bold"
                                style={{ color: "#814E1E" }}>
                                €{bundles.duo.price.toFixed(2)}
                              </span>
                              <div className="text-sm text-gray-500 line-through">
                                €{bundles.duo.originalPrice.toFixed(2)}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "#D6AD61" }}>
                                €{bundles.duo.perItem.toFixed(2)} per stuk
                              </div>
                            </div>
                          </div>
                        </label>

                        {/* Trio Option - Best Value */}
                        <label
                          className={`block cursor-pointer rounded-lg border-2 p-4 transition-all relative ${
                            selectedBundle === "trio"
                              ? "border-[#814E1E] bg-gradient-to-r from-[#FFF9F0] to-[#FFFAF5] shadow-lg"
                              : "border-gray-200 hover:border-[#D6AD61]"
                          }`}>
                          <div className="absolute -top-3 left-4 flex items-center space-x-2">
                            <span
                              className="px-3 py-1 text-xs font-bold text-white rounded-full"
                              style={{ backgroundColor: "#814E1E" }}>
                              BESTE WAARDE
                            </span>
                            <span
                              className="pulse-animation px-3 py-1 text-xs font-bold rounded-full"
                              style={{
                                backgroundColor: "#FCCE4E",
                                color: "#814E1E",
                              }}>
                              🚚 GRATIS VERZENDING
                            </span>
                          </div>
                          <input
                            type="radio"
                            name="bundle"
                            value="trio"
                            checked={selectedBundle === "trio"}
                            onChange={(e) =>
                              setSelectedBundle(
                                e.target.value as "single" | "duo" | "trio"
                              )
                            }
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedBundle === "trio"
                                    ? "border-[#814E1E]"
                                    : "border-gray-400"
                                }`}>
                                {selectedBundle === "trio" && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: "#814E1E",
                                    }}></div>
                                )}
                              </div>
                              <div>
                                <span
                                  className="font-medium"
                                  style={{ color: "#814E1E" }}>
                                  Trio
                                </span>
                                <span
                                  className="text-sm ml-2 font-bold"
                                  style={{ color: "#D6AD61" }}>
                                  Bespaar €{bundles.trio.savings.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className="text-2xl font-bold"
                                style={{ color: "#814E1E" }}>
                                €{bundles.trio.price.toFixed(2)}
                              </span>
                              <div className="text-sm text-gray-500 line-through">
                                €{bundles.trio.originalPrice.toFixed(2)}
                              </div>
                              <div
                                className="text-sm font-medium"
                                style={{ color: "#D6AD61" }}>
                                Slechts €{bundles.trio.perItem.toFixed(2)} per
                                stuk!
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })()}
              </div>

              {/* Dynamic Price Display - Third on mobile, fourth on desktop - Only shown when bundle is selected */}
              {selectedBundle && (
                <div className="order-3 lg:order-4 pb-2 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "#814E1E" }}>
                      €{getCurrentPrice().toFixed(2)}
                    </span>
                    {getCurrentSavings() > 0 && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          €{bundles[selectedBundle].originalPrice.toFixed(2)}
                        </span>
                        <span
                          className="text-white px-3 py-1 rounded-full text-sm font-bold"
                          style={{ backgroundColor: "#814E1E" }}>
                          BESPAAR €{getCurrentSavings().toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Price per wash calculation */}
                  <div className="bg-[#F8F6F0] px-4 py-2 rounded-lg inline-block mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#814E1E" }}>
                      Slechts {Math.round((basePrice / 40) * 100)} cent per
                      wasbeurt
                    </span>
                  </div>

                  {selectedBundle !== "single" && (
                    <div className="text-sm" style={{ color: "#814E1E" }}>
                      💰 Je bespaart €{getCurrentSavings().toFixed(2)} |{" "}
                      {bundles[selectedBundle].quantity}x 40+ wasbeurten
                    </div>
                  )}
                </div>
              )}

              {/* Add to Cart Button - Fourth on mobile, sixth on desktop */}
              <div className="order-4 lg:order-6 space-y-4 mb-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full text-black py-4 px-8 rounded-xl text-lg font-bold uppercase hover:opacity-90 transition-all transform hover:scale-[1.02] shadow-lg"
                  style={{
                    background:
                      selectedBundle === "trio"
                        ? "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)"
                        : "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
                  }}>
                  <span
                    className={
                      selectedBundle === "trio" ? "text-white" : "text-black"
                    }>
                    🛒 NU BESTELLEN{" "}
                    {selectedBundle === "trio" ? "- GRATIS VERZENDING!" : ""}
                  </span>
                </button>

                <div className="text-center">
                  <div
                    className="flex items-center justify-center space-x-4 text-sm mb-3"
                    style={{ color: "#814E1E" }}>
                    <span>🔒 Veilig betalen</span>
                    <span>📦 30 dagen retour</span>
                    <span>⭐ 9.8/10 tevredenheid</span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "#814E1E" }}>
                    Betaal veilig met:
                  </p>
                  <Image
                    src="/figma/productpagina/betaaliconen.png"
                    alt="Betaalmethodes"
                    width={250}
                    height={35}
                    className="mx-auto"
                  />
                </div>

                {/* We promise you section - using bottom_check from ACF if available */}
                {product.bottom_check && product.bottom_check.length > 0 && (
                  <div className="mt-6 p-4 bg-[#F8F6F0] rounded-lg border border-[#D6AD61]">
                    <h4 className="font-bold mb-3" style={{ color: "#814E1E" }}>
                      {product.bottom_check_title || "Wij beloven je"}
                    </h4>
                    <div className="space-y-2">
                      {product.bottom_check.map((check, index) => (
                        <CheckmarkItem key={index} text={check.item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Description - Hidden on mobile, first on desktop */}
              {product.description && (
                <div className="hidden lg:block order-5 lg:order-1 my-6 p-4 bg-[#F8F6F0] rounded-lg border border-[#D6AD61]">
                  <ProductDescription
                    description={
                      product.full_description ||
                      product.description ||
                      "Geen beschrijving beschikbaar"
                    }
                    maxChars={156}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* SECTION 01 END: Hero Section */}

        {/* SECTION 02 START: Product Information Tabs/Accordion */}
        {/* Product Information Sections - Different styles for mobile/desktop */}
        {((product.product_info && product.product_info.length > 0) ||
          (product.details && product.details.length > 0) ||
          ingredients.length > 0) && (
          <div className="mb-20">
            {/* Mobile Accordion View */}
            <div className="md:hidden max-w-4xl mx-auto space-y-4">
              {/* 1. Beschrijving Accordion Item */}
              <CollapsibleSection title="BESCHRIJVING" defaultOpen={false}>
                <div className="px-0 pt-2">
                  <div className="accordion-content">
                    <ProductDescription
                      description={
                        product.full_description ||
                        product.description ||
                        "Geen beschrijving beschikbaar"
                      }
                      maxChars={156}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* 2. Gebruiksaanwijzing Accordion Item */}
              <CollapsibleSection
                title="GEBRUIKSAANWIJZING"
                defaultOpen={false}>
                <div className="px-0 pt-2">
                  <div className="accordion-content">
                    <div className="space-y-4">
                      <p>
                        1. Voeg 3-5 ml wasparfum toe aan het wasverzachtervakje
                        van je wasmachine.
                      </p>
                      <p>
                        2. Start je wasprogramma zoals gewoonlijk. De wasparfum
                        wordt automatisch tijdens de laatste spoelbeurt
                        toegevoegd.
                      </p>
                      <p>
                        3. Geniet van heerlijk geurende was die tot 6 weken
                        blijft ruiken!
                      </p>
                      <p>
                        <strong>Tip:</strong> Voor een intensere geur kun je tot
                        10 ml gebruiken. Experimenteer om jouw perfecte
                        hoeveelheid te vinden.
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* 3. Verzending en Retour Accordion Item */}
              <CollapsibleSection
                title="VERZENDING EN RETOUR"
                defaultOpen={false}>
                <div className="px-0 pt-2">
                  <div className="accordion-content">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-3">
                          Verzending
                        </h2>
                        <ul className="space-y-1">
                          <li>
                            • Gratis verzending vanaf €40 in Nederland en België
                          </li>
                          <li>• Voor 16:00 besteld, vandaag verzonden</li>
                          <li>• Levertijd: 1-2 werkdagen</li>
                          <li>• Track & Trace code per e-mail</li>
                        </ul>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold mb-3">
                          Retourbeleid
                        </h2>
                        <ul className="space-y-1">
                          <li>• 30 dagen bedenktijd</li>
                          <li>• Gratis retourneren</li>
                          <li>• Geld terug binnen 14 dagen</li>
                          <li>• Product moet ongeopend zijn</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* 5. Waarschuwing Accordion Item */}
              {product.details && product.details.length > 0 && (
                <CollapsibleSection title="WAARSCHUWING" defaultOpen={false}>
                  <div className="px-0 pt-2">
                    <div className="accordion-content">
                      {product.details.map((detail, index) => (
                        <div key={index} className="mb-4">
                          <h2 className="text-xl font-semibold mb-3">
                            {detail.title}
                          </h2>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: detail.content,
                            }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>
              )}
            </div>

            {/* Desktop Tabs View */}
            <div className="hidden md:block max-w-5xl mx-auto">
              <TabsSection
                tabTitles={[
                  "BESCHRIJVING",
                  "GEBRUIKSAANWIJZING",
                  "VERZENDING EN RETOUR",
                  "WAARSCHUWING",
                ]}
                tabContents={[
                  // Tab 1: Beschrijving
                  <div
                    key="beschrijving"
                    className="py-10 text-center max-w-3xl mx-auto">
                    <div className="accordion-content prose prose-lg max-w-none mx-auto">
                      <div
                        style={{ color: "#814E1E" }}
                        dangerouslySetInnerHTML={{
                          __html:
                            product.full_description ||
                            product.description ||
                            "Geen beschrijving beschikbaar",
                        }}
                      />
                    </div>
                  </div>,

                  // Tab 2: Gebruiksaanwijzing
                  <div
                    key="gebruiksaanwijzing"
                    className="py-10 max-w-3xl mx-auto">
                    <div className="accordion-content">
                      <div className="space-y-4">
                        <p>
                          1. Voeg 3-5 ml wasparfum toe aan het
                          wasverzachtervakje van je wasmachine.
                        </p>
                        <p>
                          2. Start je wasprogramma zoals gewoonlijk. De
                          wasparfum wordt automatisch tijdens de laatste
                          spoelbeurt toegevoegd.
                        </p>
                        <p>
                          3. Geniet van heerlijk geurende was die tot 6 weken
                          blijft ruiken!
                        </p>
                        <p>
                          <strong>Tip:</strong> Voor een intensere geur kun je
                          tot 10 ml gebruiken. Experimenteer om jouw perfecte
                          hoeveelheid te vinden.
                        </p>
                      </div>
                    </div>
                  </div>,

                  // Tab 3: Verzending en Retour
                  <div key="verzending" className="py-10 max-w-3xl mx-auto">
                    <div className="accordion-content">
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">
                            Verzending
                          </h2>
                          <ul className="space-y-2">
                            <li>
                              • Gratis verzending vanaf €40 in Nederland en
                              België
                            </li>
                            <li>• Voor 16:00 besteld, vandaag verzonden</li>
                            <li>• Levertijd: 1-2 werkdagen</li>
                            <li>• Track & Trace code per e-mail</li>
                          </ul>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold mb-4">
                            Retourbeleid
                          </h2>
                          <ul className="space-y-2">
                            <li>• 30 dagen bedenktijd</li>
                            <li>• Gratis retourneren</li>
                            <li>• Geld terug binnen 14 dagen</li>
                            <li>• Product moet ongeopend zijn</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>,

                  // Tab 4: Waarschuwing
                  <div key="waarschuwing" className="py-10 max-w-3xl mx-auto">
                    <div className="accordion-content">
                      {product.details && product.details.length > 0 ? (
                        product.details.map((detail, index) => (
                          <div key={index} className="mb-6">
                            <h2
                              className="text-xl font-semibold mb-3"
                              style={{ color: "#814E1E" }}>
                              {detail.title}
                            </h2>
                            <div
                              style={{ color: "#814E1E" }}
                              dangerouslySetInnerHTML={{
                                __html: detail.content,
                              }}></div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center">
                          <p style={{ color: "#814E1E" }}>
                            Waarschuwing informatie wordt geladen...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>,
                ]}
              />
            </div>
          </div>
        )}
        {/* SECTION 02 END: Product Information Tabs/Accordion */}

        {/* SECTION 03 START: USP Features (4 Grid Items) */}
        <div className="mb-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* USP Item 1 */}
              <div className="bg-[#F4F2EB] p-8 flex flex-col items-center">
                <h3
                  className="font-bold text-lg uppercase tracking-wider text-center mb-1"
                  style={{ color: "#454545" }}>
                  LIEF VOOR MENS & DIER
                </h3>
                <p
                  className="text-lg text-center font-bold"
                  style={{ color: "#D6AD61" }}>
                  100% DIERPROEFVRIJ ONTWIKKELD
                </p>
              </div>

              {/* USP Item 2 */}
              <div className="bg-[#F4F2EB] p-8 flex flex-col items-center">
                <h3
                  className="font-bold text-lg uppercase tracking-wider text-center mb-1"
                  style={{ color: "#D6AD61" }}>
                  DUURZAAM GEPRODUCEERD
                </h3>
                <p
                  className="text-lg text-center font-bold"
                  style={{ color: "#454545" }}>
                  VRIJ VAN MICROPLASTICS & RECYCLEBAAR
                </p>
              </div>

              {/* USP Item 3 */}
              <div className="bg-[#F4F2EB] p-8 flex flex-col items-center">
                <h3
                  className="font-bold text-lg uppercase tracking-wider text-center mb-1"
                  style={{ color: "#454545" }}>
                  GEUREXPLOSIE IN JE KAST
                </h3>
                <p
                  className="text-lg text-center font-bold"
                  style={{ color: "#D6AD61" }}>
                  TOT WEL WEKEN LANG EEN HEERLIJKE GEUR
                </p>
              </div>

              {/* USP Item 4 */}
              <div className="bg-[#F4F2EB] p-8 flex flex-col items-center">
                <h3
                  className="font-bold text-lg uppercase tracking-wider text-center mb-1"
                  style={{ color: "#D6AD61" }}>
                  WASPARFUM VOOR ALLE KLEDING
                </h3>
                <p
                  className="text-lg text-center font-bold"
                  style={{ color: "#454545" }}>
                  GESCHIKT VOOR ALLE TEXTIELSOORTEN
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 03 END: USP Features */}

        {/* SECTION 05 START: Bekend van en verkrijgbaar bij */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold mb-12"
              style={{ color: "#333333" }}>
              Bekend van en verkrijgbaar bij
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {/* De Telegraaf */}
              <div className="w-32 md:w-40 h-16 relative flex items-center">
                <Image
                  src="/figma/logos/telegraaf-logo.png"
                  alt="De Telegraaf"
                  width={160}
                  height={64}
                  className="object-contain"
                />
              </div>

              {/* RTL4 */}
              <div className="w-32 md:w-40 h-16 relative flex items-center">
                <Image
                  src="/figma/logos/rtl4-logo.png"
                  alt="RTL 4"
                  width={160}
                  height={64}
                  className="object-contain"
                />
              </div>

              {/* Etos */}
              <div className="w-32 md:w-40 h-16 relative flex items-center">
                <Image
                  src="/figma/logos/etos-logo.png"
                  alt="Etos"
                  width={160}
                  height={64}
                  className="object-contain"
                />
              </div>

              {/* Primera */}
              <div className="w-32 md:w-40 h-16 relative flex items-center">
                <Image
                  src="/figma/logos/primera-logo.png"
                  alt="Primera"
                  width={160}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* View All Products Button */}
          <div className="text-center">
            <Link
              href="/wasparfum"
              className="inline-block border-2 border-[#333333] text-[#333333] rounded-full px-12 py-4 font-medium hover:bg-[#F8F6F0] transition-colors">
              <div className="flex items-center justify-center">
                <span className="mr-2">Bekijk alle wasgeuren</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
        {/* SECTION 05 END: Bekend van en verkrijgbaar bij */}

        {/* SECTION 07 START: Brand Story Section with Image */}
        <div className="mb-16">
          {/* Image Section */}
          <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-t-xl">
            <Image
              src="/figma/backgrounds/jacaranda-tree.jpg"
              alt="Wasgeurtje luxe wasparfums"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Text Section */}
          <div className="bg-[#F8F6F0] p-8 rounded-b-xl">
            <div className="max-w-3xl mx-auto">
              <p className="font-eb-garamond text-[18px] md:text-[20px] leading-relaxed text-[#333333]">
                Verwen je zintuigen met wasgeurtje's luxe wasparfums. Geniet van
                een heerlijk geurende was en zeg vaarwel tegen muffe luchtjes.
                Wasgeurtje, rechtstreeks geïmporteerd uit Italië, staat voor
                milieubewustzijn en pure verfrissing
              </p>
              <div className="mt-8 text-center">
                <Link
                  href="/wasparfum"
                  className="inline-block border-2 border-[#333333] text-[#333333] rounded-full px-8 py-3 font-medium hover:bg-[#F8F6F0] transition-colors">
                  <div className="flex items-center">
                    <span className="mr-2">Ontdek de wereld van wasparfum</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 07 END: Brand Story Section */}

        {/* SECTION 08 START: Ingredients Section */}
        {ingredients && ingredients.length > 0 && (
          <div className="mb-16 py-12 bg-[#F8F6F0] rounded-3xl overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
              <div>
                <h3
                  className="text-3xl font-bold text-center mb-8"
                  style={{ color: "#333333" }}>
                  Ingrediënten
                </h3>
                <p
                  className="text-center max-w-3xl mx-auto mb-8"
                  style={{ color: "#814E1E" }}>
                  Ontdek de zorgvuldig geselecteerde ingrediënten die ons{" "}
                  {product.title} zijn unieke en langdurige geur geven. Alle
                  ingrediënten zijn van hoge kwaliteit en met zorg samengesteld
                  voor de perfecte geurervaring.
                </p>

                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {ingredients.map((ingredient, index) => {
                      let imgSrc = "";
                      if (typeof ingredient.image === "string") {
                        if (ingredient.image.startsWith("http")) {
                          imgSrc = ingredient.image;
                        } else {
                          imgSrc = getIngredientImageSrc(ingredient.image);
                        }
                      } else {
                        imgSrc = getIngredientImageSrc(ingredient.image);
                      }

                      if (
                        !imgSrc ||
                        imgSrc === "/figma/productpagina/default-ingredient.png"
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={index}
                          className="text-center transform transition-transform hover:scale-105">
                          <div
                            className="w-32 h-32 mx-auto mb-4 rounded-full shadow-md flex items-center justify-center"
                            style={{
                              backgroundColor: "rgba(214, 173, 97, 0.1)",
                              boxShadow: "0 4px 20px rgba(214, 173, 97, 0.2)",
                            }}>
                            <Image
                              src={imgSrc}
                              alt={ingredient.name}
                              width={80}
                              height={80}
                              className="object-contain"
                              unoptimized={imgSrc.startsWith("http")}
                            />
                          </div>
                          <h5
                            className="font-medium text-lg"
                            style={{ color: "#814E1E" }}>
                            {ingredient.name}
                          </h5>
                          <p
                            className="text-sm mt-1"
                            style={{ color: "#814E1E", opacity: 0.7 }}>
                            Natuurlijk & puur
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* SECTION 08 END: Ingredients Section */}

        {/* SECTION 10 START: Social Proof (Testimonials) */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-8"
              style={{ color: "#333333" }}>
              Wat Nederlandse vrouwen zeggen
            </h2>
            <p className="text-xl" style={{ color: "#814E1E", opacity: 0.8 }}>
              Meer dan 50.000 tevreden klanten kunnen niet liegen
            </p>
          </div>

          <div className="relative">
            {/* Scrollable container */}
            <div
              className="overflow-x-auto pb-4 hide-scrollbar"
              id="testimonial-container">
              <div
                className="flex space-x-6"
                style={{ width: "max-content", minWidth: "100%" }}
                id="testimonial-slider">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-sm flex-shrink-0"
                    style={{ width: "clamp(280px, 30vw, 400px)" }}>
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-5 h-5 text-[#D6AD61]"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p
                      className="mb-4 italic text-lg"
                      style={{ color: "#814E1E" }}>
                      "{testimonial.text}"
                    </p>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "#814E1E" }}>
                      {testimonial.name} - {testimonial.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 10 END: Social Proof */}

        {/* SECTION 11 START: Trust Badges (4 Icons) */}
        <div className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="py-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-12 overflow-hidden rounded-sm shadow-md relative">
                  <div className="absolute inset-0 bg-[#AE1C28] w-full h-1/3"></div>
                  <div className="absolute inset-0 top-1/3 bg-white w-full h-1/3"></div>
                  <div className="absolute inset-0 top-2/3 bg-[#21468B] w-full h-1/3"></div>
                </div>
              </div>
              <h4 className="font-bold text-lg" style={{ color: "#814E1E" }}>
                Gemaakt in Nederland
              </h4>
              <p
                className="text-sm mt-2"
                style={{ color: "#814E1E", opacity: 0.7 }}>
                Lokaal geproduceerd
              </p>
            </div>
            <div className="py-6">
              <div className="text-5xl mb-4">🌱</div>
              <h4 className="font-bold text-lg" style={{ color: "#814E1E" }}>
                100% Natuurlijk
              </h4>
              <p
                className="text-sm mt-2"
                style={{ color: "#814E1E", opacity: 0.7 }}>
                Geen schadelijke stoffen
              </p>
            </div>
            <div className="py-6">
              <div className="text-5xl mb-4">💚</div>
              <h4 className="font-bold text-lg" style={{ color: "#814E1E" }}>
                Milieuvriendelijk
              </h4>
              <p
                className="text-sm mt-2"
                style={{ color: "#814E1E", opacity: 0.7 }}>
                Duurzaam & biologisch
              </p>
            </div>
            <div className="py-6">
              <div className="text-5xl mb-4">👶</div>
              <h4 className="font-bold text-lg" style={{ color: "#814E1E" }}>
                Baby-vriendelijk
              </h4>
              <p
                className="text-sm mt-2"
                style={{ color: "#814E1E", opacity: 0.7 }}>
                Veilig voor het hele gezin
              </p>
            </div>
          </div>
        </div>
        {/* SECTION 11 END: Trust Badges */}

        {/* SECTION 04 START: Related Products (Meest verkochte) */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "#333333" }}>
                Meest verkochte producten
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <div key={relProduct.id} className="flex flex-col">
                  <Link
                    href={`/wasparfum/${relProduct.slug}`}
                    className="group">
                    <div
                      className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-[#D6AD61]"
                      style={{ borderColor: "#E5E5E5" }}>
                      <div className="relative h-[180px] md:h-[250px] bg-[#F8F6F0] flex items-center justify-center p-3 md:p-6">
                        {relProduct.sale && (
                          <span
                            className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold"
                            style={{ backgroundColor: "#814E1E" }}>
                            SALE
                          </span>
                        )}
                        <Image
                          src={relProduct.image}
                          alt={relProduct.title}
                          width={180}
                          height={220}
                          className="object-contain h-full w-auto transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="p-3 md:p-4">
                        <h3
                          className="text-center font-medium mb-1 text-sm md:text-base"
                          style={{ color: "#333333" }}>
                          {relProduct.title}
                        </h3>
                        <div className="text-center">
                          <p
                            className="text-base md:text-xl font-bold"
                            style={{ color: "#D6AD61" }}>
                            {relProduct.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-1 md:mt-2 text-xs text-center text-gray-500">
                    250 ml
                  </div>
                  <button
                    onClick={() =>
                      addToCart({
                        id: relProduct.id,
                        title: relProduct.title,
                        price: parseFloat(relProduct.price.replace("€", "")),
                        image: relProduct.image,
                      })
                    }
                    className="mt-2 w-full py-2 md:py-3 px-2 md:px-4 rounded-md text-base md:text-lg font-medium transition-all"
                    style={{
                      background: "#D6AD61",
                      color: "#FFFFFF",
                    }}>
                    Toevoegen aan winkelwagen
                  </button>
                  <div className="mt-1 text-xs text-center relative">
                    <div
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer group hover:scale-105"
                      style={{
                        background:
                          "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)",
                        color: "white",
                      }}
                      onClick={() => {
                        setShippingTooltipProduct(relProduct.id);
                        setShowShippingTooltip(true);
                        // Auto-hide after 4 seconds
                        setTimeout(() => {
                          setShowShippingTooltip(false);
                          setShippingTooltipProduct(null);
                        }, 4000);
                      }}>
                      <svg
                        className="w-3 h-3 mr-1 group-hover:animate-bounce"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1l1.68 5.39A3 3 0 008.62 15h5.76a3 3 0 002.94-2.61L18 7H6.41l-.77-3H3z" />
                      </svg>
                      Gratis verzending vanaf €40
                      <svg
                        className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {/* Smart Shipping Tooltip */}
                    {showShippingTooltip &&
                      shippingTooltipProduct === relProduct.id && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-fadeIn">
                          <div className="bg-white rounded-lg shadow-xl border-2 border-[#D6AD61] p-4 w-64">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <span className="text-2xl mr-2">🎯</span>
                                <h4
                                  className="font-bold text-sm"
                                  style={{ color: "#814E1E" }}>
                                  Slim bestellen!
                                </h4>
                              </div>
                              <p
                                className="text-xs mb-3"
                                style={{ color: "#333333" }}>
                                {(() => {
                                  const productPrice = parseFloat(
                                    relProduct.price
                                      .replace("€", "")
                                      .replace(",", ".")
                                  );
                                  const totalWithProduct =
                                    subtotal + productPrice;
                                  const remaining = Math.max(
                                    0,
                                    40 - totalWithProduct
                                  );

                                  if (hasReachedFreeShipping) {
                                    return "Je hebt al gratis verzending! 🎉";
                                  } else if (totalWithProduct >= 40) {
                                    return (
                                      <>
                                        Met dit product krijg je{" "}
                                        <strong>gratis verzending</strong>! 🚚
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        Voeg nog{" "}
                                        <span
                                          className="font-bold"
                                          style={{ color: "#814E1E" }}>
                                          €
                                          {remaining
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </span>{" "}
                                        toe voor{" "}
                                        <strong>gratis verzending</strong>
                                      </>
                                    );
                                  }
                                })()}
                              </p>

                              {/* Dynamic Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      ((subtotal +
                                        parseFloat(
                                          relProduct.price
                                            .replace("€", "")
                                            .replace(",", ".")
                                        )) /
                                        40) *
                                        100,
                                      100
                                    )}%`,
                                    background:
                                      hasReachedFreeShipping ||
                                      subtotal +
                                        parseFloat(
                                          relProduct.price
                                            .replace("€", "")
                                            .replace(",", ".")
                                        ) >=
                                        40
                                        ? "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)"
                                        : "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)",
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: "#814E1E" }}>
                                  Winkelwagen: €
                                  {subtotal.toFixed(2).replace(".", ",")}
                                </span>
                                <span
                                  className="font-bold"
                                  style={{ color: "#D6AD61" }}>
                                  Met dit: €
                                  {(
                                    subtotal +
                                    parseFloat(
                                      relProduct.price
                                        .replace("€", "")
                                        .replace(",", ".")
                                    )
                                  )
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </div>

                              {/* CTA buttons */}
                              <div className="mt-3 space-y-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add current product to cart
                                    addToCart({
                                      id: relProduct.id,
                                      title: relProduct.title,
                                      price: parseFloat(
                                        relProduct.price
                                          .replace("€", "")
                                          .replace(",", ".")
                                      ),
                                      image: relProduct.image,
                                    });
                                    setShowShippingTooltip(false);
                                  }}
                                  className="w-full py-2 px-3 rounded-md text-xs font-bold text-white transition-all hover:opacity-90"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, #814E1E 0%, #D6AD61 100%)",
                                  }}>
                                  🛒 Voeg toe + bekijk meer
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowShippingTooltip(false);
                                    // Scroll to related products or bundle section
                                    const element = document.querySelector(
                                      ".grid.grid-cols-2.md\\:grid-cols-4"
                                    );
                                    if (element) {
                                      element.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }
                                  }}
                                  className="w-full py-1 px-3 text-xs font-medium border border-[#D6AD61] rounded-md transition-all hover:bg-[#FFF9F0]"
                                  style={{ color: "#814E1E" }}>
                                  💡 Bekijk andere producten
                                </button>
                              </div>
                            </div>

                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#D6AD61]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* SECTION 04 END: Related Products */}

        {/* SECTION 12 START: FAQ Section */}
        <div className="mb-20">
          <h2
            className="text-3xl font-bold text-center mb-8"
            style={{ color: "#333333" }}>
            Veelgestelde vragen
          </h2>
          <div className="space-y-6 max-w-4xl mx-auto">
            {[
              {
                q: "Hoe lang blijft de geur zitten?",
                a: "Tot 6 weken in je kast! Veel langer dan gewone wasverzachter.",
              },
              {
                q: "Is het veilig voor gevoelige huid?",
                a: "Ja, volledig hypoallergeen en getest door dermatologen.",
              },
              {
                q: "Kan ik het combineren met wasverzachter?",
                a: "Ja, gebruik ons product in plaats van wasverzachter voor het beste resultaat.",
              },
              {
                q: "Hoeveel wasbeurten kan ik ermee doen?",
                a: "Gemiddeld 40+ wasbeurten, afhankelijk van dosering.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <h4
                  className="font-bold text-lg mb-3"
                  style={{ color: "#814E1E" }}>
                  {faq.q}
                </h4>
                <p
                  className="text-base"
                  style={{ color: "#814E1E", opacity: 0.8 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* SECTION 12 END: FAQ Section */}

        {/* SECTION 13 START: Final CTA (Call to Action) */}
        <div
          className="rounded-3xl p-12 text-center text-white mb-16 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #814E1E 0%, #D6AD61 100%)",
          }}>
          <h2 className="text-3xl font-bold mb-6">
            Klaar voor de perfecte wasgeur?
          </h2>
          <p className="text-2xl mb-8 opacity-90">
            Sluit je aan bij 50.000+ tevreden Nederlandse vrouwen
          </p>
          <button
            onClick={handleAddToCart}
            className="bg-white px-16 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
            style={{ color: "#814E1E" }}>
            JA, IK WIL {product.title.toUpperCase()} PROBEREN!
          </button>
          <p className="text-lg mt-6 opacity-90">
            ✓ 30 dagen geld-terug-garantie ✓ Gratis verzending ✓ Vandaag
            besteld, morgen geleverd
          </p>
        </div>
        {/* SECTION 13 END: Final CTA */}
      </section>
      {/* Footer */}
      {/* <Footer /> */}
    </main>
  );
}
