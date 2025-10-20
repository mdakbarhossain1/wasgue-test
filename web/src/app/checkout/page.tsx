"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart, CartItem } from "context/CartContext";
import { useAuth, Address } from "context/AuthContext";
import CheckoutLoyaltyInfo from "components/CheckoutLoyaltyInfo";
import CheckoutAuthPopup from "components/CheckoutAuthPopup";
import { z } from "zod";
import emailSpellChecker from "@zootools/email-spell-checker";
import PaymentPage from "./payment/page";
import TestimonialsSection from "components/sections/TestimonialsSection";
import Slider from "react-slick";
// Email validation schema
const emailSchema = z.string().email("Voer een geldig e-mailadres in");

// List of disposable email domains (expand as needed)
const disposableEmailDomains = new Set([
  "tempmail.com",
  "throwaway.email",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
  "disposablemail.com",
  "temp-mail.org",
  "tempmail.net",
  "throwawaymail.com",
  "maildrop.cc",
  "mintemail.com",
  "mailcatch.com",
  "emailondeck.com",
  "fakeinbox.com",
  "mohmal.com",
  "trbvm.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "dropmail.me",
  "inboxkitten.com",
  "getairmail.com",
  "anonymbox.com",
  "trash-mail.at",
  "temp-mail.io",
  "mailnesia.com",
  "nada.email",
]);

// Progress steps for the checkout
const CHECKOUT_STEPS = ["Winkelwagen", "Gegevens", "Betaling"];

export default function CheckoutPage() {
  // Force text colors to be visible regardless of color scheme
  useEffect(() => {
    // Add a class to the body for checkout page specific styling
    document.body.classList.add("checkout-page");

    return () => {
      document.body.classList.remove("checkout-page");
    };
  }, []);
  const router = useRouter();
  const {
    items,
    subtotal,
    clearCart,
    addToCart,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { user, isLoggedIn, orders, fetchOrders } = useAuth();

  // Unique addresses from past orders and user profile
  const [previousAddresses, setPreviousAddresses] = useState<
    {
      id: string;
      name: string;
      fullName: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
    }[]
  >([]);

  // Swipe functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Netherlands-only postcode lookup state
  const [isNetherlandsSelected, setIsNetherlandsSelected] = useState(true);

  // Auth popup state
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const [showManualAddressInput, setShowManualAddressInput] = useState(false);
  const [addressFound, setAddressFound] = useState(false);

  // Shipping address lookup state
  const [isLookingUpShippingPostcode, setIsLookingUpShippingPostcode] =
    useState(false);
  const [shippingPostcodeError, setShippingPostcodeError] = useState("");
  const [showManualShippingAddressInput, setShowManualShippingAddressInput] =
    useState(false);
  const [shippingAddressFound, setShippingAddressFound] = useState(false);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: "fixed" | "percentage";
  } | null>(null);
  const [discountError, setDiscountError] = useState("");

  // Address refresh state to trigger re-render after deletion
  const [addressRefresh, setAddressRefresh] = useState(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(2); // Start at "Gegevens" step
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the maximum step reached
  const [maxStepReached, setMaxStepReached] = useState(2); // Start at "Gegevens" step

  // Handle step navigation
  const handleStepClick = (stepIndex: number) => {
    const targetStep = stepIndex + 1;

    // Only allow navigation to steps that have been reached before
    if (targetStep <= maxStepReached) {
      setCurrentStep(targetStep);

      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Optional: Add some visual feedback
      console.log(
        `Navigating to step ${targetStep}: ${CHECKOUT_STEPS[stepIndex]}`
      );
    }
  };

  // Update max step reached when currentStep changes
  useEffect(() => {
    if (currentStep > maxStepReached) {
      setMaxStepReached(currentStep);
    }
  }, [currentStep, maxStepReached]);

  // Form data
  const [formData, setFormData] = useState({
    // Personal details
    email: "",
    firstName: "",
    lastName: "",
    phone: "",

    // Billing address
    billingAddress: "",
    billingHouseNumber: "",
    billingHouseAddition: "",
    billingPostcode: "",
    billingCity: "",
    billingCountry: "NL",

    // Shipping address
    useShippingAddress: false,
    shippingAddress: "",
    shippingHouseNumber: "",
    shippingHouseAddition: "",
    shippingPostcode: "",
    shippingCity: "",
    shippingCountry: "NL",

    // Selected address (for logged-in users with multiple addresses)
    selectedAddressId: "",

    // Additional
    companyName: "",
    vatNumber: "",
    notes: "",

    // Marketing
    newsletter: false,
    acceptTerms: false,

    // Payment
    paymentMethod: "ideal",
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        billingAddress: user.address?.street
          ? user.address.street.split(" ").slice(0, -1).join(" ")
          : "",
        billingHouseNumber: user.address?.street
          ? user.address.street.split(" ").slice(-1)[0]
          : "",
        billingHouseAddition: "",
        billingCity: user.address?.city || "",
        billingPostcode: user.address?.postalCode || "",
        billingCountry: user.address?.country || "NL",
        newsletter: user.preferences?.newsletter || false,
      }));
    }
  }, [isLoggedIn, user]);

  // Redirect if cart is empty, but wait a bit to make sure cart items are loaded
  useEffect(() => {
    // Set a small timeout to ensure the cart items are loaded from localStorage
    const redirectTimer = setTimeout(() => {
      if (items.length === 0) {
        router.push("/");
      }
    }, 300); // 300ms delay to give localStorage time to load

    return () => clearTimeout(redirectTimer);
  }, [items, router]);

  // Fetch orders and extract unique addresses
  useEffect(() => {
    if (isLoggedIn && user) {
      // Fetch the latest orders
      fetchOrders().then(() => {});
    }
  }, [isLoggedIn, user, fetchOrders]);

  // Helper function to generate consistent address ID like WordPress plugin
  const generateAddressId = (street: string, postalCode: string): string => {
    // Use CRC32-like hash which is more predictable than trying to replicate MD5
    const text = street + postalCode;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to positive hex string
    const result = Math.abs(hash).toString(16);
    console.log("🔑 Generated address ID:", {
      street,
      postalCode,
      hash: result,
    });
    return result;
  };

  // Process orders to extract unique addresses
  useEffect(() => {
    console.log(
      "🔄 Processing addresses - orders:",
      orders?.length,
      "user:",
      !!user,
      "refresh:",
      addressRefresh
    );

    if ((orders && orders.length > 0) || user?.address?.street) {
      // Get deleted addresses from localStorage
      const deletedAddressIds = JSON.parse(
        localStorage.getItem("deletedAddresses") || "[]"
      );
      console.log(
        "🗑️ Deleted address IDs from localStorage:",
        deletedAddressIds
      );

      // Create a map to track unique addresses by street
      const addressMap = new Map();

      // Add addresses from user profile
      if (user?.addresses && user.addresses.length > 0) {
        user.addresses.forEach((address) => {
          const fullStreet = `${address.street} ${address.houseNumber}${
            address.houseAddition || ""
          }`;
          const addressKey =
            `${fullStreet}-${address.postalCode}`.toLowerCase();
          const addressId = generateAddressId(fullStreet, address.postalCode);

          if (!deletedAddressIds.includes(addressId)) {
            addressMap.set(addressKey, {
              id: addressId,
              name:
                address.label ||
                (address.isDefault ? "Standaard adres" : "Opgeslagen adres"),
              fullName: `${address.firstName || user.firstName} ${
                address.lastName || user.lastName
              }`,
              street: fullStreet,
              city: address.city,
              postalCode: address.postalCode,
              country: address.country,
            });
          }
        });
      }
      // Add current user address first (if available) - for backwards compatibility
      else if (user?.address?.street) {
        const userAddressKey =
          `${user.address.street}-${user.address.postalCode}`.toLowerCase();
        const addressId = generateAddressId(
          user.address.street,
          user.address.postalCode
        );

        // Only add if not deleted
        if (!deletedAddressIds.includes(addressId)) {
          addressMap.set(userAddressKey, {
            id: addressId,
            name: `Adres van ${user.firstName} ${user.lastName}`,
            fullName: `${user.firstName} ${user.lastName}`,
            street: user.address.street,
            city: user.address.city,
            postalCode: user.address.postalCode,
            country: user.address.country,
          });
        }
      }

      // Extract addresses from orders
      orders.forEach((order, index) => {
        if (order.shippingAddress) {
          const address = order.shippingAddress;
          const addressKey =
            `${address.street}-${address.postalCode}`.toLowerCase();
          // Use the same ID generation as WordPress plugin
          const addressId = generateAddressId(
            address.street,
            address.postalCode
          );

          console.log("🔍 Processing order address:", {
            street: address.street,
            postalCode: address.postalCode,
            generatedId: addressId,
            deleted: deletedAddressIds.includes(addressId),
          });

          // Only add if not already in the map and not deleted
          if (
            !addressMap.has(addressKey) &&
            address.street &&
            address.postalCode &&
            !deletedAddressIds.includes(addressId)
          ) {
            addressMap.set(addressKey, {
              id: addressId,
              name: `Adres van ${address.name || "vorige bestelling"}`,
              fullName:
                address.name ||
                `${user?.firstName || ""} ${user?.lastName || ""}`,
              street: address.street,
              city: address.city,
              postalCode: address.postalCode,
              country: address.country || "NL",
            });
          }
        }
      });

      // Convert map to array
      const uniqueAddresses = Array.from(addressMap.values());
      console.log(
        "📍 Final unique addresses after filtering:",
        uniqueAddresses.length,
        uniqueAddresses
      );

      setPreviousAddresses(uniqueAddresses);

      // Auto-select first address if no address is selected yet
      if (uniqueAddresses.length > 0 && !formData.selectedAddressId) {
        const firstAddress = uniqueAddresses[0];
        setFormData((prev) => ({
          ...prev,
          selectedAddressId: firstAddress.id,
          billingAddress: firstAddress.street.split(" ").slice(0, -1).join(" "), // Extract street name without house number
          billingHouseNumber: firstAddress.street.split(" ").slice(-1)[0], // Extract house number (last part)
          billingHouseAddition: "", // Reset addition when selecting pre-saved address
          billingCity: firstAddress.city,
          billingPostcode: firstAddress.postalCode,
          billingCountry: firstAddress.country,
        }));
      }
    }
  }, [orders, user, addressRefresh]);

  // Improved drag handlers with better UX
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLElement;
    setIsDragging(false); // Reset initially
    setStartX(e.pageX);
    setScrollLeft(container.scrollLeft);
    container.style.userSelect = "none";

    // Add global mouse events for better tracking
    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      const diff = Math.abs(moveEvent.pageX - startX);
      if (diff > 5) {
        // Only start dragging after 5px movement
        setIsDragging(true);
        container.style.cursor = "grabbing";
      }
      if (isDragging) {
        moveEvent.preventDefault();
        const walk = (moveEvent.pageX - startX) * 1.5; // Reduced speed for better control
        container.scrollLeft = scrollLeft - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      container.style.cursor = "";
      container.style.userSelect = "";
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handled by global event listeners now
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handled by global event listeners now
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // No longer needed with global listeners
  };

  // Wheel scroll handler for horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    const container = e.currentTarget as HTMLElement;
    if (e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;

      // Check if scrolled from start position
      if (container.scrollLeft > 0) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }

      // Check if can scroll right
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScrollLeft - 10) {
        // 10px tolerance
        setCanScrollRight(false);
      } else {
        setCanScrollRight(true);
      }
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = e.currentTarget as HTMLElement;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const container = e.currentTarget as HTMLElement;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Enhanced email validation function
  const validateEmail = (
    email: string
  ): { isValid: boolean; error?: string } => {
    try {
      // Basic email validation with Zod
      emailSchema.parse(email);

      // Check for disposable email
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain && disposableEmailDomains.has(domain)) {
        return {
          isValid: false,
          error: "Wegwerp e-mailadressen zijn niet toegestaan",
        };
      }

      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.issues[0].message };
      }
      return { isValid: false, error: "Ongeldig e-mailadres" };
    }
  };

  // Handle address deletion
  const handleDeleteAddress = async (addressId: string) => {
    console.log("🗑️ Deleting address:", addressId);

    // Remove from local state immediately
    setPreviousAddresses((prev) =>
      prev.filter((addr) => addr.id !== addressId)
    );

    // Save deleted address ID to localStorage
    const deletedAddresses = JSON.parse(
      localStorage.getItem("deletedAddresses") || "[]"
    );
    if (!deletedAddresses.includes(addressId)) {
      deletedAddresses.push(addressId);
      localStorage.setItem(
        "deletedAddresses",
        JSON.stringify(deletedAddresses)
      );
      console.log(
        "💾 Updated deleted addresses in localStorage:",
        deletedAddresses
      );
    }

    // If deleted address was selected, clear selection
    if (formData.selectedAddressId === addressId) {
      setFormData((prev) => ({
        ...prev,
        selectedAddressId: "",
        billingAddress: "",
        billingHouseNumber: "",
        billingHouseAddition: "",
        billingCity: "",
        billingPostcode: "",
        billingCountry: "NL",
      }));
    }

    // Trigger re-render of address list
    setAddressRefresh((prev) => prev + 1);
    console.log("🔄 Triggered address refresh");

    // Try to call WordPress API in background (optional)
    if (user?.email) {
      try {
        const response = await fetch(
          "/api/woocommerce/customer/address/delete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              addressId: addressId,
            }),
          }
        );

        if (response.ok) {
          console.log(
            "✅ Successfully called WordPress API for address deletion"
          );
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.log(
            "⚠️ WordPress API call failed (this is OK):",
            response.status,
            errorData
          );
        }
      } catch (error) {
        console.log("⚠️ WordPress API call failed (this is OK):", error);
        // Silently fail - local deletion already succeeded
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Email validation
    if (name === "email") {
      if (value) {
        const validation = validateEmail(value);
        if (!validation.isValid) {
          setEmailError(validation.error || "Voer een geldig e-mailadres in");
          setEmailSuggestion(null);
        } else {
          setEmailError("");
          // Check for typos when email is valid using @zootools/email-spell-checker
          const suggestion = emailSpellChecker.run({ email: value });
          if (suggestion?.full) {
            setEmailSuggestion(suggestion.full);
          } else {
            setEmailSuggestion(null);
          }
        }
      } else {
        setEmailError("");
        setEmailSuggestion(null);
      }
    }

    // Country selection handling
    if (name === "billingCountry") {
      const isNetherlands = value === "NL";
      setIsNetherlandsSelected(isNetherlands);

      // Clear postcode related fields and errors when switching away from Netherlands
      if (!isNetherlands) {
        setPostcodeError("");
        setAddressFound(false);
        setShowManualAddressInput(true); // Always show manual input for non-NL countries
        setIsLookingUpPostcode(false);
      } else {
        setShowManualAddressInput(false); // Hide manual input for Netherlands (use postcode lookup)
      }
    }

    // Clear postcode error and reset states when user types
    if (
      name === "billingPostcode" ||
      name === "billingHouseNumber" ||
      name === "billingHouseAddition"
    ) {
      setPostcodeError("");
      setAddressFound(false);
      setShowManualAddressInput(false);
    }

    // Clear shipping postcode error and reset states when user types
    if (
      name === "shippingPostcode" ||
      name === "shippingHouseNumber" ||
      name === "shippingHouseAddition"
    ) {
      setShippingPostcodeError("");
      setShippingAddressFound(false);
      setShowManualShippingAddressInput(false);
    }
  };

  // Postcode lookup function
  const lookupPostcode = async () => {
    // Only lookup postcodes for Netherlands
    if (!isNetherlandsSelected || formData.billingCountry !== "NL") {
      return;
    }

    if (!formData.billingPostcode || !formData.billingHouseNumber) {
      return;
    }

    setIsLookingUpPostcode(true);
    setPostcodeError("");
    setShowManualAddressInput(false);
    setAddressFound(false);

    try {
      const response = await fetch(
        `/api/postcode?postcode=${encodeURIComponent(
          formData.billingPostcode
        )}&houseNumber=${encodeURIComponent(
          formData.billingHouseNumber
        )}&addition=${encodeURIComponent(formData.billingHouseAddition || "")}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Handle invalid postcode format gracefully
        if (errorData.message === "Ongeldige postcode formaat") {
          setPostcodeError("Controleer je postcode (bijv. 1234AB)");
        } else {
          setPostcodeError(errorData.message || "Adres niet gevonden");
        }

        setAddressFound(false);
        setShowManualAddressInput(true);

        // Clear the auto-filled fields when API fails
        setFormData((prev) => ({
          ...prev,
          billingAddress: "",
          billingCity: "",
        }));
        return;
      }

      const data = await response.json();

      // Update form with the found address (street ONLY; number/addition are separate fields)
      setFormData((prev) => ({
        ...prev,
        billingAddress: data.street,
        billingCity: data.city,
        billingCountry: "NL",
      }));

      setAddressFound(true);
      setShowManualAddressInput(false);
    } catch (error) {
      // Only log network errors, not validation errors
      if (error instanceof TypeError) {
        console.error("Network error during postcode lookup:", error);
        setPostcodeError("Verbindingsfout. Probeer het opnieuw.");
      } else {
        setPostcodeError("Controleer je postcode en huisnummer");
      }

      setAddressFound(false);
      setShowManualAddressInput(true);

      // Clear the auto-filled fields when API fails
      setFormData((prev) => ({
        ...prev,
        billingAddress: "",
        billingCity: "",
      }));
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  // Shipping postcode lookup function
  const lookupShippingPostcode = async () => {
    if (!formData.shippingPostcode || !formData.shippingHouseNumber) {
      return;
    }

    // Only perform postcode lookup for Netherlands
    if (formData.shippingCountry !== "NL") {
      return;
    }

    setIsLookingUpShippingPostcode(true);
    setShippingPostcodeError("");
    setShowManualShippingAddressInput(false);
    setShippingAddressFound(false);

    try {
      const response = await fetch(
        `/api/postcode?postcode=${encodeURIComponent(
          formData.shippingPostcode
        )}&houseNumber=${encodeURIComponent(
          formData.shippingHouseNumber
        )}&addition=${encodeURIComponent(formData.shippingHouseAddition || "")}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Handle invalid postcode format gracefully
        if (errorData.message === "Ongeldige postcode formaat") {
          setShippingPostcodeError("Controleer je postcode (bijv. 1234AB)");
        } else {
          setShippingPostcodeError(errorData.message || "Adres niet gevonden");
        }

        setShippingAddressFound(false);
        setShowManualShippingAddressInput(true);

        // Clear the auto-filled fields when API fails
        setFormData((prev) => ({
          ...prev,
          shippingAddress: "",
          shippingCity: "",
        }));
        return;
      }

      const data = await response.json();

      // Update form with the found shipping address (street ONLY)
      setFormData((prev) => ({
        ...prev,
        shippingAddress: data.street,
        shippingCity: data.city,
        shippingCountry: "NL",
      }));

      setShippingAddressFound(true);
      setShowManualShippingAddressInput(false);
    } catch (error) {
      // Only log network errors, not validation errors
      if (error instanceof TypeError) {
        console.error("Network error during shipping postcode lookup:", error);
        setShippingPostcodeError("Verbindingsfout. Probeer het opnieuw.");
      } else {
        setShippingPostcodeError("Controleer je postcode en huisnummer");
      }

      setShippingAddressFound(false);
      setShowManualShippingAddressInput(true);

      // Clear the auto-filled fields when API fails
      setFormData((prev) => ({
        ...prev,
        shippingAddress: "",
        shippingCity: "",
      }));
    } finally {
      setIsLookingUpShippingPostcode(false);
    }
  };

  // Apply discount code function
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Voer een kortingscode in");
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError("");

    try {
      // Call WooCommerce API to validate coupon
      const response = await fetch(`/api/woocommerce/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupon_code: discountCode,
          subtotal: subtotal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ongeldige kortingscode");
      }

      const couponData = await response.json();

      // Apply the discount
      setAppliedDiscount({
        code: discountCode,
        amount: couponData.discount_amount,
        type: couponData.discount_type === "percent" ? "percentage" : "fixed",
      });

      setDiscountCode("");
    } catch (error) {
      console.error("Discount code error:", error);
      setDiscountError(
        error instanceof Error
          ? error.message
          : "Kortingscode kon niet worden toegepast"
      );
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Remove discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError("");
  };

  // State for dynamic product suggestions
  const [suggestedProducts, setSuggestedProducts] = useState<
    {
      id: string;
      title: string;
      price: number;
      image: string;
      isNew?: boolean;
      description?: string;
      badge?: string;
      inCart?: boolean;
    }[]
  >([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showProductsPopup, setShowProductsPopup] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );

  // Fetch real product data from WooCommerce API
  const fetchProductsByIds = async (productIds: string[]) => {
    try {
      const response = await fetch(
        `/api/woocommerce/products?ids=${productIds.join(",")}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Open products popup and load all products (excluding cart items)
  const openProductsPopup = async () => {
    setShowProductsPopup(true);

    // Get products excluding those already in cart
    try {
      const cartProductIds = new Set(items.map((item) => item.id));
      const availableProductIds = BEST_SELLING_PRODUCT_IDS.filter(
        (id) => !cartProductIds.has(id)
      );

      if (availableProductIds.length === 0) {
        setAllProducts([]);
        return;
      }

      const wcProducts = await fetchProductsByIds(availableProductIds);

      const transformedProducts = wcProducts.map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        badge: getProductBadge(product.id),
        in_cart: false, // Always false since we filter out cart items
        quantity: 1, // Default quantity for popup
      }));

      setAllProducts(transformedProducts);
    } catch (error) {
      console.error("Error loading products for popup:", error);
    }
  };

  // Toggle product selection in popup
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Update quantity for a product in popup
  const updatePopupQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setAllProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, quantity: newQuantity }
          : product
      )
    );
  };

  // Add selected products to cart with their quantities
  const addSelectedProductsToCart = () => {
    selectedProducts.forEach((productId) => {
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        // Add the product with the specified quantity
        const cartItem: CartItem = {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: product.quantity || 1,
        };
        addToCart(cartItem);
      }
    });

    // Reset selection and close popup
    setSelectedProducts(new Set());
    setShowProductsPopup(false);
  };

  // Enhanced addToCart function with product rotation
  const addToCartWithRotation = (product: {
    id: string;
    title: string;
    price: number;
    image: string;
  }) => {
    addToCart(product);

    // Log the addition for rotation logic
  };

  // Best selling product IDs (based on WooCommerce data) - updated with valid IDs
  const BEST_SELLING_PRODUCT_IDS = [
    "335706",
    "335060",
    "334999",
    "1893",
    "44876",
    "267628",
    "273942",
    "273946",
    "273947",
    "273949",
  ];

  // Badge mapping for products
  const getProductBadge = (productId: string) => {
    const badgeMap: Record<string, string> = {
      "335706": "#1 Combideal",
      "335060": "Bestseller",
      "334999": "Premium",
      "1893": "Bestseller",
      "44876": "Accessoire",
      "267628": "Nieuw",
      "273942": "Premium",
      "273946": "Premium",
      "273947": "Premium",
      "273949": "Premium",
    };
    return badgeMap[productId] || "Populair";
  };

  // Get product IDs user hasn't ordered before (for logged in users)
  const getUnorderedProductIds = () => {
    // Get product IDs already in cart
    const cartProductIds = new Set(items.map((item) => item.id));

    if (!isLoggedIn || !orders || orders.length === 0) {
      // For non-logged users, exclude cart items
      return BEST_SELLING_PRODUCT_IDS.filter(
        (productId) => !cartProductIds.has(productId)
      );
    }

    // Extract all product IDs from user's order history with frequency
    const orderedProductIds = new Set<string>();
    const orderFrequency: Record<string, number> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        orderedProductIds.add(item.id);
        orderFrequency[item.id] =
          (orderFrequency[item.id] || 0) + item.quantity;
      });
    });

    // First priority: Products never ordered before (excluding cart items)
    const neverOrdered = BEST_SELLING_PRODUCT_IDS.filter(
      (productId) =>
        !orderedProductIds.has(productId) && !cartProductIds.has(productId)
    );

    if (neverOrdered.length > 0) {
      return neverOrdered;
    }

    // Fallback: Previously ordered products (most frequently ordered first, excluding cart items)
    const previouslyOrdered = Object.entries(orderFrequency)
      .filter(([productId]) => !cartProductIds.has(productId)) // Exclude cart items
      .sort(([, freqA], [, freqB]) => freqB - freqA) // Sort by frequency (highest first)
      .map(([productId]) => productId)
      .filter((productId) => BEST_SELLING_PRODUCT_IDS.includes(productId)); // Only include our product pool

    return previouslyOrdered;
  };

  // Get best selling product IDs (for non-logged users, excluding cart items)
  const getBestSellingProductIds = () => {
    // Get product IDs already in cart
    const cartProductIds = new Set(items.map((item) => item.id));

    // Filter out products already in cart
    return BEST_SELLING_PRODUCT_IDS.filter(
      (productId) => !cartProductIds.has(productId)
    );
  };

  // Update suggested products when user login status or orders change
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);

      try {
        let productIds: string[] = [];

        if (isLoggedIn && user) {
          productIds = getUnorderedProductIds();
        } else {
          productIds = getBestSellingProductIds();
        }

        if (productIds.length > 0) {
          // Fetch real product data from WooCommerce - get up to 6 products for rotation
          const wcProducts = await fetchProductsByIds(productIds.slice(0, 6));

          // Transform to our format with badges (no cart status needed since we filter them out)
          const transformedProducts = wcProducts.map((product: any) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            description:
              product.description ||
              `Geniet van deze ${product.title.toLowerCase()}`,
            badge: getProductBadge(product.id),
            inCart: false, // Always false since we only fetch non-cart products
          }));

          // Show the fetched products (already filtered to exclude cart items)
          setSuggestedProducts(transformedProducts.slice(0, 2)); // Always exactly 2 suggestions
        } else {
          setSuggestedProducts([]);
        }
      } catch (error) {
        console.error("Error loading suggested products:", error);
        setSuggestedProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [isLoggedIn, user, orders, items]);

  const calculateShipping = () => {
    return subtotal >= 40 ? 0 : 4.95;
  };

  const calculateVolumeDiscount = () => {
    // 10% volume discount when subtotal is €75 or more
    if (subtotal >= 75) {
      return subtotal * 0.1;
    }
    return 0;
  };

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.type === "percentage") {
      return (subtotal * appliedDiscount.amount) / 100;
    } else {
      return appliedDiscount.amount;
    }
  };

  const calculateTotal = () => {
    const shipping = calculateShipping();
    const discount = calculateDiscount();
    const volumeDiscount = calculateVolumeDiscount();
    return Math.max(0, subtotal + shipping - discount - volumeDiscount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!formData.email) {
      setError("E-mailadres is verplicht");
      setEmailError("E-mailadres is verplicht");
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "Voer een geldig e-mailadres in");
      setEmailError(emailValidation.error || "Voer een geldig e-mailadres in");
      return;
    }

    // Validate form
    if (!formData.acceptTerms) {
      setError("Je moet de algemene voorwaarden accepteren");
      return;
    }

    if (items.length === 0) {
      setError("Je winkelwagen is leeg");
      return;
    }

    setIsProcessing(true);

    try {
      // Helper function to map cart IDs to WooCommerce IDs
      const mapCartIdToWooCommerceId = (cartId: string): string => {
        const mapping: Record<string, string> = {
          "trial-pack": "1893",
          "blossom-drip": "1410",
          "full-moon": "1425",
          wasstrips: "335060",
          // Add more mappings as needed
        };
        return mapping[cartId] || cartId;
      };

      // Prepare line items for API with mapped IDs
      const lineItems = items.map((item) => ({
        id: mapCartIdToWooCommerceId(item.id),
        quantity: item.quantity,
      }));

      // Prepare customer data
      const customer = {
        customerId: isLoggedIn && user ? user.id : null,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,

        // Billing address
        address: formData.billingAddress,
        houseNumber: formData.billingHouseNumber,
        houseAddition: formData.billingHouseAddition,
        city: formData.billingCity,
        postcode: formData.billingPostcode,
        country: formData.billingCountry,

        // Shipping address (if different)
        useShippingAddress: formData.useShippingAddress,
        shippingAddress: formData.shippingAddress,
        shippingHouseNumber: formData.shippingHouseNumber,
        shippingHouseAddition: formData.shippingHouseAddition,
        shippingCity: formData.shippingCity,
        shippingPostcode: formData.shippingPostcode,
      };

      // Calculate final total for display
      const finalTotal = calculateTotal();

      // Calculate totals for API
      const totals = {
        subtotal: subtotal,
        discountAmount: calculateDiscount(),
        volumeDiscount: calculateVolumeDiscount(),
        shippingCost: subtotal >= 40 ? 0 : 4.95,
        finalTotal: finalTotal,
      };

      // Convert appliedDiscount to API format
      const apiDiscount = appliedDiscount
        ? {
            coupon_code: appliedDiscount.code,
            discount_type:
              appliedDiscount.type === "percentage" ? "percent" : "fixed_cart",
            discount_amount: calculateDiscount(), // Use calculated discount amount
          }
        : undefined;

      // Prepare order data for payment
      const orderData = {
        lineItems,
        customer,
        appliedDiscount: apiDiscount,
        totals,
        finalTotal,
      };

      // Store order data in sessionStorage for payment page
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
      setCurrentStep(3);

      // Redirect to payment page
      // router.push("/checkout/payment");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Er is iets misgegaan. Probeer het opnieuw."
      );
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const testimonials = [
    {
      text: "Heerlijke geuren die lang blijven hangen. De verzending was snel en het product was prachtig verpakt!",
      author: "- Maria K.",
    },
    {
      text: "Eindelijk een wasparfum dat niet te overheersend is. Perfect voor mijn gevoelige huid!",
      author: "- Jan V.",
    },
    {
      text: "Geweldige service en snelle levering. Ik bestel hier zeker weer!",
      author: "- Sophie T.",
    },
  ];

  const settings = {
    dots: false, // hides the pagination dots
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false, // hides navigation arrows
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-[#F4F2EB]">
        {/* Trust Banner */}
        <div className="bg-[#814e1e] py-2">
          <div className="container mx-auto px-4">
            {/* <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Veilig betalen</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.5 12.5l-1.5-3h-3v-2c0-1.1-.9-2-2-2h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h.76c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h3.52c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h.76c.55 0 1-.45 1-1v-3.5c0-.83-.67-1.5-1.5-1.5zm-11.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3h-3v-2.5h2.5l.5 1v1.5z" />
                </svg>
                <span>Gratis verzending vanaf €40</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>30 dagen bedenktijd</span>
              </div>
            </div> */}
            {/* Trust Badges - horizontal auto-scroll */}
            <div className="my-2">
              <div className="overflow-hidden relative">
                <div
                  className="flex animate-infinity-scroll gap-3"
                  style={{ animationPlayState: "running !important" }}
                >
                  {/* Create 4 identical sets for perfect seamless scrolling */}
                  {Array.from({ length: 4 }, (_, setIndex) =>
                    [
                      { icon: "🔒", text: "Veilig betalen" },
                      { icon: "🚚", text: "Gratis verzending vanaf €40" },
                      { icon: "♻️", text: "30 dagen bedenktijd" },
                    ].map((badge, badgeIndex) => (
                      <div
                        key={`set-${setIndex}-badge-${badgeIndex}`}
                        className="flex items-center text-xs text-gray-600 bg-[#814e1e] rounded-lg p-2 whitespace-nowrap flex-shrink-0 hover:bg-gray-100 transition-colors duration-200"
                        style={{ animationPlayState: "running" }}
                      >
                        <span className="text-sm mr-2">{badge.icon}</span>
                        <span className="font-medium">{badge.text}</span>
                      </div>
                    ))
                  ).flat()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              {CHECKOUT_STEPS.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center transition-colors ${
                      index + 1 <= maxStepReached
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-not-allowed opacity-50"
                    } ${
                      index + 1 <= currentStep
                        ? "text-[#814e1e]"
                        : "text-gray-400"
                    }`}
                    onClick={() => handleStepClick(index)}
                    title={
                      index + 1 <= maxStepReached
                        ? `Ga naar ${step}`
                        : `${step} - Nog niet beschikbaar`
                    }
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        index + 1 <= currentStep
                          ? "border-[#814e1e] bg-[#814e1e] text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {index + 1 < currentStep ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">
                      {step}
                    </span>
                  </div>
                  {index < CHECKOUT_STEPS.length - 1 && (
                    <div
                      className={`w-12 sm:w-24 h-1 mx-2 ${
                        index + 1 < currentStep ? "bg-[#814e1e]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Product Upsell Banner - Hide on Gegevens step (step 2) */}
          <div
            className={` bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg relative overflow-hidden ${
              subtotal >= 40 ? "p-4" : "p-6"
            }`}
            style={{ display: currentStep === 2 ? "none" : "block" }}
          >
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8">
              <div className="w-32 h-32 bg-green-100 rounded-full opacity-50"></div>
            </div>
            <div className="relative z-10">
              {subtotal >= 40 ? (
                // Compact layout when free shipping is achieved
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Gratis verzending behaald! 🌟
                      </h3>
                      <p className="text-xs text-gray-600">
                        Ontdek hieronder meer geweldige producten
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-medium">
                      €4,95 bespaard
                    </p>
                  </div>
                </div>
              ) : (
                // Full layout when working towards free shipping
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.5 12.5l-1.5-3h-3v-2c0-1.1-.9-2-2-2h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h.76c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h3.52c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h.76c.55 0 1-.45 1-1v-3.5c0-.83-.67-1.5-1.5-1.5zm-11.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3h-3v-2.5h2.5l.5 1v1.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Nog maar €{(40 - subtotal).toFixed(2)} voor GRATIS
                      verzending!
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Voeg nog een klein item toe aan je bestelling en bespaar
                      €4,95 op verzendkosten
                    </p>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>€{subtotal.toFixed(2)}</span>
                        <span className="font-semibold">
                          €40.00 (Gratis verzending)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 relative">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-1"
                          style={{
                            width: `${Math.min((subtotal / 40) * 100, 100)}%`,
                          }}
                        >
                          <div className="w-5 h-5 bg-white rounded-full shadow-md border-2 border-green-500"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Product Suggestions */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                  subtotal >= 40 ? "mt-3" : "mt-0"
                }`}
              >
                {isLoadingProducts
                  ? // Loading skeleton
                    Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={`loading-${index}`}
                        className="bg-white rounded-lg p-3 border border-gray-200 animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    ))
                  : suggestedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-green-400 transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML =
                                    '<span class="text-2xl">📦</span>';
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {product.title}
                              </h4>
                              {product.badge && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                    product.badge.includes("Nieuw")
                                      ? "bg-blue-500"
                                      : product.badge.includes("Bestseller")
                                      ? "bg-orange-500"
                                      : product.badge.includes("Premium")
                                      ? "bg-purple-500"
                                      : "bg-green-500"
                                  }`}
                                >
                                  {product.badge}
                                </span>
                              )}
                              {isLoggedIn && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Nieuw voor jou!
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-green-600 mt-1">
                              €{product.price.toFixed(2)}
                            </p>
                          </div>
                          {product.inCart ? (
                            <div className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full border border-green-300 flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Toegevoegd
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                addToCartWithRotation({
                                  id: product.id,
                                  title: product.title,
                                  price: product.price,
                                  image: product.image,
                                });
                              }}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors"
                            >
                              + Toevoegen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                {/* Show message if no suitable products */}
                {!isLoadingProducts && suggestedProducts.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    <p className="text-sm">
                      {isLoggedIn
                        ? "Je hebt al onze populairste producten geprobeerd! 🎉"
                        : "Bekijk onze shop voor meer geweldige producten!"}
                    </p>
                  </div>
                )}
              </div>

              {/* Alternative CTA */}
              <div className="mt-4 text-center">
                <button
                  onClick={openProductsPopup}
                  className="text-sm text-[#814e1e] underline hover:no-underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Bekijk alle producten
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Discount Achieved Banner */}
        {subtotal >= 75 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">%</span>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">
                  Fantastisch! Je krijgt 10% VOLUME KORTING
                </h3>
                <p className="text-sm text-purple-700">
                  Je bespaart €{(subtotal * 0.1).toFixed(2)} extra op deze
                  bestelling!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* upsell */}
        <div className="upsell">
          <div className="container mx-auto px-4 md:py-8 pt-0 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 2: Checkout Form */}
                {currentStep === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-semibold mb-4">
                        Contactgegevens
                      </h2>
                      {!isLoggedIn && (
                        <div className="mb-4 p-4 bg-[#f8f5ed] rounded-lg">
                          <p className="text-sm">
                            Heb je al een account?{" "}
                            <button
                              onClick={() => setShowAuthPopup(true)}
                              className="text-[#814e1e] underline hover:no-underline cursor-pointer"
                            >
                              Log in of registreer je
                            </button>
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            E-mailadres *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              onBlur={() => {
                                if (formData.email) {
                                  const validation = validateEmail(
                                    formData.email
                                  );
                                  if (!validation.isValid) {
                                    setEmailError(
                                      validation.error ||
                                        "Voer een geldig e-mailadres in"
                                    );
                                    setEmailSuggestion(null);
                                  } else {
                                    // Check for typos on blur
                                    const suggestion = emailSpellChecker.run({
                                      email: formData.email,
                                    });
                                    if (
                                      suggestion?.full &&
                                      suggestion.full !== formData.email
                                    ) {
                                      setEmailSuggestion(suggestion.full);
                                    }
                                  }
                                }
                              }}
                              required
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent ${
                                emailError
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                              placeholder="jouwnaam@email.com"
                            />
                          </div>
                          {emailError && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <svg
                                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-sm text-red-700 font-medium">
                                {emailError}
                              </p>
                            </div>
                          )}

                          {emailSuggestion && !emailError && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <svg
                                className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm text-amber-700 font-medium">
                                  Bedoelde je misschien:
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      email: emailSuggestion,
                                    }));
                                    setEmailSuggestion(null);
                                  }}
                                  className="text-sm text-amber-700 underline hover:no-underline mt-1"
                                >
                                  {emailSuggestion}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Voornaam *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                              <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Achternaam *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                              <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Telefoonnummer
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                            </div>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                              placeholder="06-12345678"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-[#814e1e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h2 className="text-xl font-semibold">Bezorgadres</h2>
                      </div>

                      {/* Saved Addresses for Logged-in Users */}
                      {isLoggedIn && (
                        <div className="mb-6">
                          {/* Swipeable layout for all screen sizes */}
                          <div className="relative">
                            <div
                              className="overflow-x-auto scrollbar-hide"
                              onMouseDown={handleMouseDown}
                              onWheel={handleWheel}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              onScroll={(e) => {
                                const container = e.currentTarget;
                                if (container.scrollLeft > 0) {
                                  setHasScrolled(true);
                                } else {
                                  setHasScrolled(false);
                                }

                                // Check if can scroll right
                                const maxScrollLeft =
                                  container.scrollWidth - container.clientWidth;
                                if (
                                  container.scrollLeft >=
                                  maxScrollLeft - 10
                                ) {
                                  // 10px tolerance
                                  setCanScrollRight(false);
                                } else {
                                  setCanScrollRight(true);
                                }
                              }}
                              style={{
                                scrollSnapType: "x mandatory",
                                WebkitOverflowScrolling: "touch",
                                cursor: isDragging ? "grabbing" : "default",
                              }}
                            >
                              <div
                                className="flex gap-4 pb-4"
                                style={{ scrollSnapType: "x mandatory" }}
                              >
                                {previousAddresses.map((address) => (
                                  <div
                                    key={address.id}
                                    className={`relative group flex-shrink-0 w-[320px] md:w-[350px] border-2 rounded-xl p-6 cursor-pointer transition-all select-none shadow-sm ${
                                      formData.selectedAddressId ===
                                        address.id ||
                                      (!formData.selectedAddressId &&
                                        previousAddresses.indexOf(address) ===
                                          0)
                                        ? "border-[#0071CE] shadow-lg bg-blue-50"
                                        : "border-gray-300 hover:border-gray-400 hover:shadow-md bg-white"
                                    }`}
                                    style={{ scrollSnapAlign: "start" }}
                                    onClick={(e) => {
                                      // Prevent click if we were dragging
                                      if (isDragging) {
                                        e.preventDefault();
                                        return;
                                      }
                                      setFormData((prev) => ({
                                        ...prev,
                                        selectedAddressId: address.id,
                                        billingAddress: address.street
                                          .split(" ")
                                          .slice(0, -1)
                                          .join(" "), // Extract street name without house number
                                        billingHouseNumber: address.street
                                          .split(" ")
                                          .slice(-1)[0], // Extract house number (last part)
                                        billingHouseAddition: "", // Reset addition when selecting pre-saved address
                                        billingCity: address.city,
                                        billingPostcode: address.postalCode,
                                        billingCountry: address.country,
                                      }));
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                  >
                                    {/* Delete button - always visible on mobile, hover on desktop */}
                                    <button
                                      className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-2 bg-red-50 hover:bg-red-100 rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAddress(address.id);
                                      }}
                                      type="button"
                                      aria-label="Verwijder adres"
                                    >
                                      <svg
                                        className="w-4 h-4 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>

                                    <div className="flex items-center gap-3 mb-3">
                                      <svg
                                        className="w-5 h-5 text-[#814e1e] flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <h3 className="font-semibold text-base text-gray-900">
                                        {address.name}
                                      </h3>
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed ml-8 space-y-1">
                                      <p className="font-medium">
                                        {address.fullName}
                                      </p>
                                      <p className="font-medium">
                                        {address.street}
                                      </p>
                                      <p>
                                        {address.postalCode} {address.city}
                                      </p>
                                      <p className="text-gray-500">
                                        {(() => {
                                          switch (address.country) {
                                            case "NL":
                                              return "Nederland";
                                            case "BE":
                                              return "België";
                                            case "DE":
                                              return "Duitsland";
                                            default:
                                              return address.country;
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {/* Add new address card */}
                                <div
                                  className="flex-shrink-0 w-[320px] md:w-[350px] border-2 border-dashed border-gray-300 rounded-lg p-5 cursor-pointer flex items-center justify-center hover:border-[#0071CE] hover:bg-gray-50 transition-all select-none"
                                  style={{ scrollSnapAlign: "start" }}
                                  onClick={(e) => {
                                    // Prevent click if we were dragging
                                    if (isDragging) {
                                      e.preventDefault();
                                      return;
                                    }
                                    setFormData((prev) => ({
                                      ...prev,
                                      selectedAddressId: "new",
                                      billingAddress: "",
                                      billingHouseNumber: "",
                                      billingHouseAddition: "",
                                      billingCity: "",
                                      billingPostcode: "",
                                      billingCountry: "NL",
                                    }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                >
                                  <div className="text-center">
                                    <div className="w-12 h-12 bg-[#0071CE] text-white rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-light hover:bg-[#0063B8] transition-colors">
                                      +
                                    </div>
                                    <p className="text-[#0071CE] text-sm font-medium">
                                      Voeg nieuw adres toe
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Scroll indicators */}
                            {previousAddresses.length > 1 && (
                              <div className="flex justify-center gap-1 mt-3">
                                {[...previousAddresses, { id: "new" }].map(
                                  (item, index) => (
                                    <div
                                      key={`indicator-${item.id}`}
                                      className={`h-1.5 rounded-full transition-all ${
                                        (item.id === "new" &&
                                          formData.selectedAddressId ===
                                            "new") ||
                                        (item.id !== "new" &&
                                          formData.selectedAddressId ===
                                            item.id) ||
                                        (!formData.selectedAddressId &&
                                          index === 0 &&
                                          item.id !== "new")
                                          ? "w-4 bg-[#0071CE]"
                                          : "w-1.5 bg-gray-300"
                                      }`}
                                    />
                                  )
                                )}
                              </div>
                            )}

                            {/* Desktop navigation arrows - Left arrow only visible when scrolled */}
                            {previousAddresses.length > 1 && (
                              <>
                                {hasScrolled && (
                                  <button
                                    type="button"
                                    className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
                                    onClick={() => {
                                      const container = document.querySelector(
                                        ".overflow-x-auto"
                                      ) as HTMLElement;
                                      if (container) {
                                        container.scrollBy({
                                          left: -370,
                                          behavior: "smooth",
                                        });
                                      }
                                    }}
                                  >
                                    <svg
                                      className="w-6 h-6 text-gray-700"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path
                                        d="M15 19l-7-7 7-7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {canScrollRight && (
                                  <button
                                    type="button"
                                    className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
                                    onClick={() => {
                                      const container = document.querySelector(
                                        ".overflow-x-auto"
                                      ) as HTMLElement;
                                      if (container) {
                                        container.scrollBy({
                                          left: 370,
                                          behavior: "smooth",
                                        });
                                      }
                                    }}
                                  >
                                    <svg
                                      className="w-6 h-6 text-gray-700"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path
                                        d="M9 5l7 7-7 7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Only show manual address entry if no saved address is selected or user is not logged in */}
                      {(!isLoggedIn ||
                        !user?.address?.street ||
                        formData.selectedAddressId === "new") && (
                        <div className="space-y-4">
                          {/* Country selection - Always shown first */}
                          <div>
                            <label
                              htmlFor="billingCountry"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Land *
                            </label>
                            <div className="relative">
                              <svg
                                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <select
                                id="billingCountry"
                                name="billingCountry"
                                value={formData.billingCountry}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent appearance-none bg-white"
                              >
                                <option value="NL">Nederland</option>
                                <option value="BE">België</option>
                                <option value="DE">Duitsland</option>
                              </select>
                              <svg
                                className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Postcode and House Number with Auto-lookup - Only for Netherlands */}
                          {isNetherlandsSelected &&
                            formData.billingCountry === "NL" && (
                              <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                  <label
                                    htmlFor="billingPostcode"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Postcode *
                                  </label>
                                  <div className="relative">
                                    <svg
                                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      id="billingPostcode"
                                      name="billingPostcode"
                                      value={formData.billingPostcode}
                                      onChange={handleInputChange}
                                      onBlur={() => {
                                        if (
                                          isNetherlandsSelected &&
                                          formData.billingCountry === "NL" &&
                                          formData.billingPostcode &&
                                          formData.billingHouseNumber
                                        ) {
                                          lookupPostcode();
                                        }
                                      }}
                                      required
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                      placeholder="1234 AB"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label
                                    htmlFor="billingHouseNumber"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Huisnummer *
                                  </label>
                                  <div className="relative">
                                    <svg
                                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                    <input
                                      type="text"
                                      id="billingHouseNumber"
                                      name="billingHouseNumber"
                                      value={formData.billingHouseNumber}
                                      onChange={handleInputChange}
                                      onBlur={() => {
                                        if (
                                          isNetherlandsSelected &&
                                          formData.billingCountry === "NL" &&
                                          formData.billingPostcode &&
                                          formData.billingHouseNumber
                                        ) {
                                          lookupPostcode();
                                        }
                                      }}
                                      required
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                      placeholder="123"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label
                                    htmlFor="billingHouseAddition"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Toevoeging
                                  </label>
                                  <div className="relative">
                                    <svg
                                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      id="billingHouseAddition"
                                      name="billingHouseAddition"
                                      value={formData.billingHouseAddition}
                                      onChange={handleInputChange}
                                      onBlur={() => {
                                        if (
                                          isNetherlandsSelected &&
                                          formData.billingCountry === "NL" &&
                                          formData.billingPostcode &&
                                          formData.billingHouseNumber
                                        ) {
                                          lookupPostcode();
                                        }
                                      }}
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                      placeholder="A, B, bis"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Address lookup status */}
                          {isLookingUpPostcode && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0071CE]"></div>
                              Adres wordt opgezocht...
                            </div>
                          )}

                          {/* Success message when address found */}
                          {addressFound && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <p className="text-sm text-green-700">
                                  ✅ Adres gevonden en automatisch ingevuld
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-green-600">
                                <strong>
                                  {`${formData.billingAddress} ${
                                    formData.billingHouseNumber
                                  }${
                                    formData.billingHouseAddition || ""
                                  }`.trim()}
                                </strong>
                                <br />
                                {formData.billingPostcode}{" "}
                                {formData.billingCity}
                              </div>
                            </div>
                          )}

                          {/* Error message with manual input option */}
                          {postcodeError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-700">
                                ⚠️ {postcodeError}
                              </p>
                              {showManualAddressInput && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Vul hieronder uw adresgegevens handmatig in.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Manual address input (shown when API fails for NL or always for other countries) */}
                          {(showManualAddressInput ||
                            (!isNetherlandsSelected &&
                              formData.billingCountry !== "NL")) && (
                            <div className="border-t pt-4 space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <svg
                                  className="w-4 h-4 text-gray-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <h4 className="text-sm font-medium text-gray-700">
                                  {formData.billingCountry !== "NL"
                                    ? "Voer uw adresgegevens in"
                                    : "Adresgegevens handmatig invoeren"}
                                </h4>
                              </div>
                              {formData.billingCountry !== "NL" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                  <p className="text-sm text-blue-800">
                                    <svg
                                      className="w-4 h-4 inline mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Automatische postcode opzoekservice is
                                    alleen beschikbaar voor Nederlandse
                                    adressen.
                                  </p>
                                </div>
                              )}

                              <div>
                                <label
                                  htmlFor="billingAddress"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Straatnaam en huisnummer *
                                </label>
                                <div className="relative">
                                  <svg
                                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <input
                                    type="text"
                                    id="billingAddress"
                                    name="billingAddress"
                                    value={formData.billingAddress}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                    placeholder="Straatnaam en huisnummer"
                                  />
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <label
                                    htmlFor="billingPostcode"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Postcode *
                                  </label>
                                  <div className="relative">
                                    <svg
                                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      id="billingPostcode"
                                      name="billingPostcode"
                                      value={formData.billingPostcode}
                                      onChange={handleInputChange}
                                      required
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                      placeholder={
                                        formData.billingCountry === "BE"
                                          ? "1000"
                                          : formData.billingCountry === "DE"
                                          ? "10115"
                                          : "Postcode"
                                      }
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label
                                    htmlFor="billingCity"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Plaats *
                                  </label>
                                  <div className="relative">
                                    <svg
                                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      id="billingCity"
                                      name="billingCity"
                                      value={formData.billingCity}
                                      onChange={handleInputChange}
                                      required
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                      placeholder="Plaats"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {formData.useShippingAddress && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <h3 className="font-medium mb-2">Verzendadres</h3>

                          {/* Shipping Postcode and House Number with Auto-lookup */}
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label
                                htmlFor="shippingPostcode"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Postcode *
                              </label>
                              <input
                                type="text"
                                id="shippingPostcode"
                                name="shippingPostcode"
                                value={formData.shippingPostcode}
                                onChange={handleInputChange}
                                onBlur={() => {
                                  if (
                                    formData.shippingPostcode &&
                                    formData.shippingHouseNumber &&
                                    formData.shippingCountry === "NL"
                                  ) {
                                    lookupShippingPostcode();
                                  }
                                }}
                                required={formData.useShippingAddress}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                placeholder="1234 AB"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="shippingHouseNumber"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Huisnummer *
                              </label>
                              <input
                                type="text"
                                id="shippingHouseNumber"
                                name="shippingHouseNumber"
                                value={formData.shippingHouseNumber}
                                onChange={handleInputChange}
                                onBlur={() => {
                                  if (
                                    formData.shippingPostcode &&
                                    formData.shippingHouseNumber &&
                                    formData.shippingCountry === "NL"
                                  ) {
                                    lookupShippingPostcode();
                                  }
                                }}
                                required={formData.useShippingAddress}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                placeholder="123"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="shippingHouseAddition"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Toevoeging
                              </label>
                              <input
                                type="text"
                                id="shippingHouseAddition"
                                name="shippingHouseAddition"
                                value={formData.shippingHouseAddition}
                                onChange={handleInputChange}
                                onBlur={() => {
                                  if (
                                    formData.shippingPostcode &&
                                    formData.shippingHouseNumber &&
                                    formData.shippingCountry === "NL"
                                  ) {
                                    lookupShippingPostcode();
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                placeholder="A, B, bis"
                              />
                            </div>
                          </div>

                          {/* Shipping address lookup status */}
                          {isLookingUpShippingPostcode && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0071CE]"></div>
                              Verzendadres wordt opgezocht...
                            </div>
                          )}

                          {/* Success message when shipping address found */}
                          {shippingAddressFound && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <p className="text-sm text-green-700">
                                  ✅ Verzendadres gevonden en automatisch
                                  ingevuld
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-green-600">
                                <strong>{formData.shippingAddress}</strong>
                                <br />
                                {formData.shippingPostcode}{" "}
                                {formData.shippingCity}
                              </div>
                            </div>
                          )}

                          {/* Error message with manual input option for shipping */}
                          {shippingPostcodeError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-700">
                                ⚠️ {shippingPostcodeError}
                              </p>
                              {showManualShippingAddressInput && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Vul hieronder uw verzendadres handmatig in.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Manual shipping address input (only shown when API fails) */}
                          {showManualShippingAddressInput && (
                            <div className="border-t pt-4 space-y-4">
                              <h4 className="text-sm font-medium text-gray-700">
                                Verzendadres handmatig invoeren
                              </h4>

                              <div>
                                <label
                                  htmlFor="shippingAddress"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Straatnaam en huisnummer *
                                </label>
                                <div className="relative">
                                  <svg
                                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <input
                                    type="text"
                                    id="shippingAddress"
                                    name="shippingAddress"
                                    value={formData.shippingAddress}
                                    onChange={handleInputChange}
                                    required={formData.useShippingAddress}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                    placeholder="Straatnaam en huisnummer"
                                  />
                                </div>
                              </div>

                              <div>
                                <label
                                  htmlFor="shippingCity"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Plaats *
                                </label>
                                <div className="relative">
                                  <svg
                                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <input
                                    type="text"
                                    id="shippingCity"
                                    name="shippingCity"
                                    value={formData.shippingCity}
                                    onChange={handleInputChange}
                                    required={formData.useShippingAddress}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                    placeholder="Plaats"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="shippingCountry"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Land *
                            </label>
                            <select
                              id="shippingCountry"
                              name="shippingCountry"
                              value={formData.shippingCountry}
                              onChange={handleInputChange}
                              required={formData.useShippingAddress}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                            >
                              <option value="NL">Nederland</option>
                              <option value="BE">België</option>
                              <option value="DE">Duitsland</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile Order Summary Toggle */}
                    <div className="lg:hidden bg-white rounded-lg p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const summary = document.getElementById(
                            "mobile-order-summary"
                          );
                          if (summary) {
                            summary.classList.toggle("hidden");
                          }
                        }}
                        className="w-full flex items-center justify-between"
                      >
                        <span className="font-medium">Bekijk bestelling</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            €{calculateTotal().toFixed(2)}
                          </span>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1 sm:block md:hidden">
                      <div
                        id="order-summary"
                        className="bg-white rounded-lg p-6 shadow-sm sticky top-4 hidden lg:block"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <svg
                            className="w-5 h-5 text-[#814e1e]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h2 className="text-xl font-semibold">
                            Orderoverzicht
                          </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex flex-wrap gap-3">
                                <div className="relative flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={60}
                                    height={60}
                                    className="object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap justify-between items-start mb-2">
                                    <div>
                                      <h3 className="text-sm font-medium">
                                        {item.title}
                                      </h3>
                                      {item.variant && (
                                        <p className="text-xs text-gray-500">
                                          {item.variant}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeFromCart(item.id, item.variant)
                                      }
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                      title="Product verwijderen"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex flex-wrap items-center justify-between">
                                    <div className="flex flex-wrap items-center border border-gray-300 rounded">
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.variant,
                                            Math.max(1, item.quantity - 1)
                                          )
                                        }
                                        className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                        disabled={item.quantity <= 1}
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 12H4"
                                          />
                                        </svg>
                                      </button>
                                      <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[40px] text-center">
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
                                        className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="text-sm font-medium">
                                      <span className="text-gray-500">
                                        €{item.price.toFixed(2)} ×{" "}
                                        {item.quantity} ={" "}
                                      </span>
                                      <span className="text-[#814e1e] font-semibold">
                                        €
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Selected Address Display */}
                        {(formData.billingAddress ||
                          formData.selectedAddressId ||
                          (formData.useShippingAddress &&
                            formData.shippingAddress)) && (
                          <div className="border-t pt-4 mb-4">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <svg
                                className="w-4 h-4 text-[#814e1e]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Bezorgadres
                              </h3>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {(() => {
                                // Show shipping address if "Verzenden naar een ander adres" is selected and shipping address is filled
                                if (
                                  formData.useShippingAddress &&
                                  (formData.shippingAddress ||
                                    formData.shippingPostcode)
                                ) {
                                  return (
                                    <div>
                                      {(formData.firstName ||
                                        formData.lastName) && (
                                        <p className="font-medium text-gray-900">
                                          {formData.firstName}{" "}
                                          {formData.lastName}
                                        </p>
                                      )}
                                      {formData.shippingAddress ? (
                                        <>
                                          <p>
                                            {`${formData.shippingAddress} ${
                                              formData.shippingHouseNumber
                                            }${
                                              formData.shippingHouseAddition ||
                                              ""
                                            }`.trim()}
                                          </p>
                                          <p>
                                            {formData.shippingPostcode}{" "}
                                            {formData.shippingCity}
                                          </p>
                                          <p>
                                            {(() => {
                                              switch (
                                                formData.shippingCountry
                                              ) {
                                                case "NL":
                                                  return "Nederland";
                                                case "BE":
                                                  return "België";
                                                case "DE":
                                                  return "Duitsland";
                                                default:
                                                  return formData.shippingCountry;
                                              }
                                            })()}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-gray-400 italic">
                                          Verzendadres nog niet ingevuld
                                        </p>
                                      )}
                                    </div>
                                  );
                                }

                                // Otherwise show billing address (default behavior)
                                const selectedAddress = previousAddresses.find(
                                  (addr) =>
                                    addr.id === formData.selectedAddressId
                                );

                                if (selectedAddress) {
                                  return (
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {selectedAddress.fullName}
                                      </p>
                                      <p>
                                        {formData.billingAddress &&
                                        formData.billingHouseNumber
                                          ? `${formData.billingAddress} ${
                                              formData.billingHouseNumber
                                            }${
                                              formData.billingHouseAddition ||
                                              ""
                                            }`.trim()
                                          : selectedAddress.street.replace(
                                              /\s+(\d+)\s+\1(?:\s|$)/,
                                              " $1"
                                            )}
                                      </p>
                                      <p>
                                        {selectedAddress.postalCode}{" "}
                                        {selectedAddress.city}
                                      </p>
                                      <p>
                                        {(() => {
                                          switch (selectedAddress.country) {
                                            case "NL":
                                              return "Nederland";
                                            case "BE":
                                              return "België";
                                            case "DE":
                                              return "Duitsland";
                                            default:
                                              return selectedAddress.country;
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  );
                                } else if (formData.billingAddress) {
                                  // Fallback to manual address
                                  return (
                                    <div>
                                      {(formData.firstName ||
                                        formData.lastName) && (
                                        <p className="font-medium text-gray-900">
                                          {formData.firstName}{" "}
                                          {formData.lastName}
                                        </p>
                                      )}
                                      <p>
                                        {`${formData.billingAddress} ${
                                          formData.billingHouseNumber
                                        }${
                                          formData.billingHouseAddition || ""
                                        }`.trim()}
                                      </p>
                                      <p>
                                        {formData.billingPostcode}{" "}
                                        {formData.billingCity}
                                      </p>
                                      <p>
                                        {formData.billingCountry === "NL"
                                          ? "Nederland"
                                          : formData.billingCountry}
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <p className="text-gray-400 italic">
                                    Nog geen adres geselecteerd
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4 space-y-2">
                          <div className="flex flex-wrap justify-between text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Subtotaal</span>
                            </div>
                            <span>€{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-wrap justify-between text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                              </svg>
                              <span>Verzending</span>
                            </div>
                            <span>
                              {calculateShipping() === 0
                                ? "Gratis"
                                : `€${calculateShipping().toFixed(2)}`}
                            </span>
                          </div>
                          {appliedDiscount && (
                            <div className="flex flex-wrap justify-between text-sm text-green-600">
                              <div className="flex flex-wrap items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>Korting ({appliedDiscount.code})</span>
                              </div>
                              <span>-€{calculateDiscount().toFixed(2)}</span>
                            </div>
                          )}
                          {subtotal >= 75 && (
                            <div className="flex flex-wrap justify-between text-sm text-purple-600">
                              <span>Volume korting (10%)</span>
                              <span>
                                -€{calculateVolumeDiscount().toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="border-t pt-2 flex justify-between font-semibold">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-[#814e1e]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Totaal</span>
                            </div>
                            <span>€{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Loyalty Points Info */}
                        {isLoggedIn && user?.loyalty && (
                          <div className="mt-4">
                            <CheckoutLoyaltyInfo
                              orderTotal={subtotal}
                              onCouponSelect={async (couponCode) => {
                                // Apply the discount directly with the couponCode
                                setIsApplyingDiscount(true);
                                setDiscountError("");

                                try {
                                  // Call WooCommerce API to validate coupon
                                  const response = await fetch(
                                    `/api/woocommerce/coupons/validate`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        coupon_code: couponCode,
                                        subtotal: subtotal,
                                      }),
                                    }
                                  );

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(
                                      errorData.message ||
                                        "Ongeldige kortingscode"
                                    );
                                  }

                                  const couponData = await response.json();

                                  // Apply the discount
                                  setAppliedDiscount({
                                    code: couponCode,
                                    amount: couponData.discount_amount,
                                    type:
                                      couponData.discount_type === "percent"
                                        ? "percentage"
                                        : "fixed",
                                  });

                                  // Clear the discount code field
                                  setDiscountCode("");
                                } catch (error) {
                                  console.error("Discount code error:", error);
                                  setDiscountError(
                                    error instanceof Error
                                      ? error.message
                                      : "Kortingscode kon niet worden toegepast"
                                  );
                                  setAppliedDiscount(null);
                                } finally {
                                  setIsApplyingDiscount(false);
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Trust Badges */}
                        <div className="mt-6 pt-6 border-t">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                Veilig betalen met SSL-encryptie
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                30 dagen bedenktijd
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19.5 12.5l-1.5-3h-3v-2c0-1.1-.9-2-2-2h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h.76c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h3.52c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h.76c.55 0 1-.45 1-1v-3.5c0-.83-.67-1.5-1.5-1.5zm-11.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3h-3v-2.5h2.5l.5 1v1.5z" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                Gratis verzending vanaf €40
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Order Summary */}
                      <div
                        id="mobile-order-summary"
                        className="bg-white rounded-lg p-6 shadow-sm lg:hidden hidden"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <svg
                            className="w-5 h-5 text-[#814e1e]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h2 className="text-xl font-semibold">
                            Orderoverzicht
                          </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex flex-wrap gap-3">
                                <div className="relative flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={60}
                                    height={60}
                                    className="object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap justify-between items-start mb-2">
                                    <div>
                                      <h3 className="text-sm font-medium">
                                        {item.title}
                                      </h3>
                                      {item.variant && (
                                        <p className="text-xs text-gray-500">
                                          {item.variant}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeFromCart(item.id, item.variant)
                                      }
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                      title="Product verwijderen"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex flex-wrap items-center justify-between">
                                    <div className="flex flex-wrap items-center border border-gray-300 rounded">
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.variant,
                                            Math.max(1, item.quantity - 1)
                                          )
                                        }
                                        className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                        disabled={item.quantity <= 1}
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 12H4"
                                          />
                                        </svg>
                                      </button>
                                      <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[40px] text-center">
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
                                        className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="text-sm font-medium">
                                      <span className="text-gray-500">
                                        €{item.price.toFixed(2)} ×{" "}
                                        {item.quantity} ={" "}
                                      </span>
                                      <span className="text-[#814e1e] font-semibold">
                                        €
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Selected Address Display - Mobile */}
                        {(formData.billingAddress ||
                          formData.selectedAddressId ||
                          (formData.useShippingAddress &&
                            formData.shippingAddress)) && (
                          <div className="border-t pt-4 mb-4">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <svg
                                className="w-4 h-4 text-[#814e1e]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Bezorgadres
                              </h3>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {(() => {
                                // Show shipping address if "Verzenden naar een ander adres" is selected and shipping address is filled
                                if (
                                  formData.useShippingAddress &&
                                  (formData.shippingAddress ||
                                    formData.shippingPostcode)
                                ) {
                                  return (
                                    <div>
                                      {(formData.firstName ||
                                        formData.lastName) && (
                                        <p className="font-medium text-gray-900">
                                          {formData.firstName}{" "}
                                          {formData.lastName}
                                        </p>
                                      )}
                                      {formData.shippingAddress ? (
                                        <>
                                          <p>
                                            {`${formData.shippingAddress} ${
                                              formData.shippingHouseNumber
                                            }${
                                              formData.shippingHouseAddition ||
                                              ""
                                            }`.trim()}
                                          </p>
                                          <p>
                                            {formData.shippingPostcode}{" "}
                                            {formData.shippingCity}
                                          </p>
                                          <p>
                                            {(() => {
                                              switch (
                                                formData.shippingCountry
                                              ) {
                                                case "NL":
                                                  return "Nederland";
                                                case "BE":
                                                  return "België";
                                                case "DE":
                                                  return "Duitsland";
                                                default:
                                                  return formData.shippingCountry;
                                              }
                                            })()}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-gray-400 italic">
                                          Verzendadres nog niet ingevuld
                                        </p>
                                      )}
                                    </div>
                                  );
                                }

                                // Otherwise show billing address (default behavior)
                                const selectedAddress = previousAddresses.find(
                                  (addr) =>
                                    addr.id === formData.selectedAddressId
                                );

                                if (selectedAddress) {
                                  return (
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {selectedAddress.fullName}
                                      </p>
                                      <p>
                                        {formData.billingAddress &&
                                        formData.billingHouseNumber
                                          ? `${formData.billingAddress} ${
                                              formData.billingHouseNumber
                                            }${
                                              formData.billingHouseAddition ||
                                              ""
                                            }`.trim()
                                          : selectedAddress.street.replace(
                                              /\s+(\d+)\s+\1(?:\s|$)/,
                                              " $1"
                                            )}
                                      </p>
                                      <p>
                                        {selectedAddress.postalCode}{" "}
                                        {selectedAddress.city}
                                      </p>
                                      <p>
                                        {(() => {
                                          switch (selectedAddress.country) {
                                            case "NL":
                                              return "Nederland";
                                            case "BE":
                                              return "België";
                                            case "DE":
                                              return "Duitsland";
                                            default:
                                              return selectedAddress.country;
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  );
                                } else if (formData.billingAddress) {
                                  // Fallback to manual address
                                  return (
                                    <div>
                                      {(formData.firstName ||
                                        formData.lastName) && (
                                        <p className="font-medium text-gray-900">
                                          {formData.firstName}{" "}
                                          {formData.lastName}
                                        </p>
                                      )}
                                      <p>
                                        {`${formData.billingAddress} ${
                                          formData.billingHouseNumber
                                        }${
                                          formData.billingHouseAddition || ""
                                        }`.trim()}
                                      </p>
                                      <p>
                                        {formData.billingPostcode}{" "}
                                        {formData.billingCity}
                                      </p>
                                      <p>
                                        {formData.billingCountry === "NL"
                                          ? "Nederland"
                                          : formData.billingCountry}
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <p className="text-gray-400 italic">
                                    Nog geen adres geselecteerd
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4 space-y-2">
                          <div className="flex flex-wrap justify-between text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Subtotaal</span>
                            </div>
                            <span>€{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-wrap justify-between text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                              </svg>
                              <span>Verzending</span>
                            </div>
                            <span>
                              {calculateShipping() === 0
                                ? "Gratis"
                                : `€${calculateShipping().toFixed(2)}`}
                            </span>
                          </div>
                          {appliedDiscount && (
                            <div className="flex flex-wrap justify-between text-sm text-green-600">
                              <div className="flex flex-wrap items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>Korting ({appliedDiscount.code})</span>
                              </div>
                              <span>-€{calculateDiscount().toFixed(2)}</span>
                            </div>
                          )}
                          {subtotal >= 75 && (
                            <div className="flex flex-wrap justify-between text-sm text-purple-600">
                              <span>Volume korting (10%)</span>
                              <span>
                                -€{calculateVolumeDiscount().toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="border-t pt-2 flex flex-wrap justify-between font-semibold">
                            <div className="flex flex-wrap items-center gap-2">
                              <svg
                                className="w-4 h-4 text-[#814e1e]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Totaal</span>
                            </div>
                            <span>€{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Loyalty Points Info - Mobile */}
                        {isLoggedIn && user?.loyalty && (
                          <div className="mt-4">
                            <CheckoutLoyaltyInfo
                              orderTotal={subtotal}
                              onCouponSelect={async (couponCode) => {
                                // Apply the discount directly with the couponCode
                                setIsApplyingDiscount(true);
                                setDiscountError("");

                                try {
                                  // Call WooCommerce API to validate coupon
                                  const response = await fetch(
                                    `/api/woocommerce/coupons/validate`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        coupon_code: couponCode,
                                        subtotal: subtotal,
                                      }),
                                    }
                                  );

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(
                                      errorData.message ||
                                        "Ongeldige kortingscode"
                                    );
                                  }

                                  const couponData = await response.json();

                                  // Apply the discount
                                  setAppliedDiscount({
                                    code: couponCode,
                                    amount: couponData.discount_amount,
                                    type:
                                      couponData.discount_type === "percent"
                                        ? "percentage"
                                        : "fixed",
                                  });

                                  // Clear the discount code field
                                  setDiscountCode("");
                                } catch (error) {
                                  console.error("Discount code error:", error);
                                  setDiscountError(
                                    error instanceof Error
                                      ? error.message
                                      : "Kortingscode kon niet worden toegepast"
                                  );
                                  setAppliedDiscount(null);
                                } finally {
                                  setIsApplyingDiscount(false);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next Step Button */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          // Validate email before proceeding
                          if (!formData.email) {
                            setError("E-mailadres is verplicht");
                            setEmailError("E-mailadres is verplicht");
                            // Scroll to the email field
                            const emailField = document.getElementById("email");
                            if (emailField) {
                              emailField.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                              emailField.focus();
                            }
                            return;
                          }

                          const emailValidation = validateEmail(formData.email);
                          if (!emailValidation.isValid) {
                            setError(
                              emailValidation.error ||
                                "Voer een geldig e-mailadres in"
                            );
                            setEmailError(
                              emailValidation.error ||
                                "Voer een geldig e-mailadres in"
                            );
                            // Scroll to the email field
                            const emailField = document.getElementById("email");
                            if (emailField) {
                              emailField.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                              emailField.focus();
                            }
                            return;
                          }

                          setError(null);
                          setCurrentStep(3);
                        }}
                        disabled={
                          !formData.firstName ||
                          !formData.lastName ||
                          !formData.email ||
                          (!formData.billingAddress &&
                            !formData.selectedAddressId)
                        }
                        className="w-full bg-[#814e1e] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#6d3f18] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentStep === 2
                          ? "Verder naar betaling"
                          : "Verder naar overzicht"}
                      </button>
                      {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                    </div>
                  </form>
                )}

                {/* Step 3: Overview Page */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        OVERZICHT.
                      </h1>
                      <p className="text-gray-600">Totaalplaatje.</p>
                    </div>

                    {/* Kloppen je gegevens */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Kloppen je gegevens?
                        </h2>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="text-[#0071CE] hover:underline text-sm flex items-center gap-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                          Wijzig gegevens
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Hier gaan we bezorgen
                          </h3>
                          <div className="mt-1 text-sm text-gray-600">
                            {(() => {
                              // Show shipping address if selected, otherwise billing address
                              if (
                                formData.useShippingAddress &&
                                formData.shippingAddress
                              ) {
                                return (
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {formData.firstName} {formData.lastName}
                                    </p>
                                    <p>
                                      {`${formData.shippingAddress} ${
                                        formData.shippingHouseNumber
                                      }${
                                        formData.shippingHouseAddition || ""
                                      }`.trim()}
                                    </p>
                                    <p>
                                      {formData.shippingPostcode}{" "}
                                      {formData.shippingCity}
                                    </p>
                                    <p>
                                      {(() => {
                                        switch (formData.shippingCountry) {
                                          case "NL":
                                            return "Nederland";
                                          case "BE":
                                            return "België";
                                          case "DE":
                                            return "Duitsland";
                                          default:
                                            return formData.shippingCountry;
                                        }
                                      })()}
                                    </p>
                                  </div>
                                );
                              } else {
                                const selectedAddress = previousAddresses.find(
                                  (addr) =>
                                    addr.id === formData.selectedAddressId
                                );
                                if (selectedAddress) {
                                  return (
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {selectedAddress.fullName}
                                      </p>
                                      <p>
                                        {formData.billingAddress &&
                                        formData.billingHouseNumber
                                          ? `${formData.billingAddress} ${
                                              formData.billingHouseNumber
                                            }${
                                              formData.billingHouseAddition ||
                                              ""
                                            }`.trim()
                                          : selectedAddress.street.replace(
                                              /\s+(\d+)\s+\1(?:\s|$)/,
                                              " $1"
                                            )}
                                      </p>
                                      <p>
                                        {selectedAddress.postalCode}{" "}
                                        {selectedAddress.city}
                                      </p>
                                      <p>
                                        {(() => {
                                          switch (selectedAddress.country) {
                                            case "NL":
                                              return "Nederland";
                                            case "BE":
                                              return "België";
                                            case "DE":
                                              return "Duitsland";
                                            default:
                                              return selectedAddress.country;
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  );
                                } else if (formData.billingAddress) {
                                  return (
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {formData.firstName} {formData.lastName}
                                      </p>
                                      <p>
                                        {`${formData.billingAddress} ${
                                          formData.billingHouseNumber
                                        }${
                                          formData.billingHouseAddition || ""
                                        }`.trim()}
                                      </p>
                                      <p>
                                        {formData.billingPostcode}{" "}
                                        {formData.billingCity}
                                      </p>
                                      <p>
                                        {formData.billingCountry === "NL"
                                          ? "Nederland"
                                          : formData.billingCountry}
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <p className="text-gray-400 italic">
                                    Geen adres geselecteerd
                                  </p>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium text-gray-900">
                            Contactgegevens
                          </h3>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>{formData.email}</p>
                            <p>{formData.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bezorging */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Bezorging
                      </h2>
                      <p className="text-sm text-gray-600">
                        We doen ons best om uw bestelling morgen te bezorgen.
                      </p>
                    </div>

                    {/* Last Chance - Frequently Bought Together */}
                    <div className="bg-amber-50 rounded-lg p-6 shadow-sm border border-amber-200">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-2xl">⚡</span>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Laatste kans - Vaak samen gekocht
                        </h2>
                      </div>

                      <div className="space-y-3">
                        {isLoadingProducts
                          ? // Loading skeleton for overview
                            Array.from({ length: 2 }).map((_, index) => (
                              <div
                                key={`overview-loading-${index}`}
                                className="bg-white rounded-lg p-3 border border-amber-200 animate-pulse"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="w-16 h-16 bg-amber-100 rounded-lg"></div>
                                  <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                  </div>
                                  <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                                </div>
                              </div>
                            ))
                          : suggestedProducts.slice(0, 2).map((product) => (
                              <div
                                key={`overview-${product.id}`}
                                className="bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-300 transition-colors"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <img
                                      src={product.image}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML =
                                            '<span class="text-3xl">📦</span>';
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-900">
                                        {product.title}
                                      </h4>
                                      {isLoggedIn && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                          Nieuw voor jou!
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-sm font-bold text-[#814e1e]">
                                        €{product.price.toFixed(2)}
                                      </span>
                                      {product.badge && (
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                            product.badge.includes("Nieuw")
                                              ? "bg-blue-500"
                                              : product.badge.includes(
                                                  "Bestseller"
                                                ) ||
                                                product.badge.includes("#1")
                                              ? "bg-orange-500"
                                              : product.badge.includes(
                                                  "Premium"
                                                )
                                              ? "bg-purple-500"
                                              : "bg-green-500"
                                          }`}
                                        >
                                          {product.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {product.inCart ? (
                                    <div className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg border border-green-300 flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Toegevoegd
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addToCartWithRotation({
                                          id: product.id,
                                          title: product.title,
                                          price: product.price,
                                          image: product.image,
                                        });
                                      }}
                                      className="px-4 py-2 bg-[#814e1e] text-white text-sm rounded-lg hover:bg-[#6d3f18] transition-colors"
                                    >
                                      Toevoegen
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                        {/* Show fallback message if no products */}
                        {!isLoadingProducts &&
                          suggestedProducts.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <p className="text-sm">
                                {isLoggedIn
                                  ? "Geweldig! Je hebt al onze top producten in je collectie 🌟"
                                  : "Ontdek meer geweldige producten in onze shop"}
                              </p>
                              <button
                                onClick={openProductsPopup}
                                className="inline-block mt-2 text-[#814e1e] underline hover:no-underline text-sm cursor-pointer"
                              >
                                Bekijk alle producten →
                              </button>
                            </div>
                          )}
                      </div>

                      {suggestedProducts.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                          <p className="text-xs text-amber-800 text-center">
                            💡 <strong>Tip:</strong>{" "}
                            {isLoggedIn
                              ? "Deze producten zijn speciaal geselecteerd omdat je ze nog niet hebt geprobeerd!"
                              : "Klanten die deze producten erbij kochten, rapporteren 40% betere wasresultaten!"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Kies een betaalmethode */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Kies een betaalmethode
                      </h2>

                      {/* Discount Code Section */}
                      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Kortingscode gebruiken
                        </h3>

                        {!appliedDiscount ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="text"
                                value={discountCode}
                                onChange={(e) =>
                                  setDiscountCode(e.target.value)
                                }
                                placeholder="Voer kortingscode in"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#814e1e] focus:border-transparent"
                                onKeyPress={(e) =>
                                  e.key === "Enter" && applyDiscountCode()
                                }
                              />
                              <button
                                type="button"
                                onClick={applyDiscountCode}
                                disabled={
                                  isApplyingDiscount || !discountCode.trim()
                                }
                                className="px-4 py-2 bg-[#0071CE] text-white rounded-lg hover:bg-[#0063B8] disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                {isApplyingDiscount
                                  ? "Toepassen..."
                                  : "Toepassen"}
                              </button>
                            </div>

                            {discountError && (
                              <div className="mt-2 text-sm text-red-600">
                                {discountError}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Kortingscode "{appliedDiscount.code}" toegepast
                              </p>
                              <p className="text-xs text-green-600">
                                {appliedDiscount.type === "percentage"
                                  ? `${appliedDiscount.amount}% korting`
                                  : `€${appliedDiscount.amount.toFixed(
                                      2
                                    )} korting`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeDiscount}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Verwijderen
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Payment Methods */}
                      <PaymentPage
                        orderData={{
                          customer: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            phone: formData.phone,
                            companyName: formData.companyName,
                            address: formData.billingAddress,
                            houseNumber: formData.billingHouseNumber,
                            houseAddition: formData.billingHouseAddition,
                            postcode: formData.billingPostcode,
                            city: formData.billingCity,
                            shippingAddress: formData.shippingAddress,
                            shippingHouseNumber: formData.shippingHouseNumber,
                            shippingHouseAddition:
                              formData.shippingHouseAddition,
                            shippingPostcode: formData.shippingPostcode,
                            shippingCity: formData.shippingCity,
                            useShippingAddress: formData.useShippingAddress,
                          },
                          lineItems: items.map((item) => ({
                            id: item.id,
                            quantity: item.quantity,
                            price: item.price,
                          })),
                          finalTotal: calculateTotal(),
                        }}
                        onError={(error) => {
                          // Handle payment error
                          console.error("Payment error:", error);
                          setError(error);
                        }}
                      />

                      {/* Error Display */}
                      {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1 sm:hidden md:block">
                <div
                  id="order-summary"
                  className="bg-white rounded-lg p-6 shadow-sm sticky top-4 hidden lg:block"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-[#814e1e]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h2 className="text-xl font-semibold">Orderoverzicht</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex flex-wrap gap-3">
                          <div className="relative flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={60}
                              height={60}
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap justify-between items-start mb-2">
                              <div>
                                <h3 className="text-sm font-medium">
                                  {item.title}
                                </h3>
                                {item.variant && (
                                  <p className="text-xs text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(item.id, item.variant)
                                }
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Product verwijderen"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex flex-wrap items-center justify-between">
                              <div className="flex flex-wrap items-center border border-gray-300 rounded">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.variant,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[40px] text-center">
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
                                  className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-sm font-medium">
                                <span className="text-gray-500">
                                  €{item.price.toFixed(2)} × {item.quantity} ={" "}
                                </span>
                                <span className="text-[#814e1e] font-semibold">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Address Display */}
                  {(formData.billingAddress ||
                    formData.selectedAddressId ||
                    (formData.useShippingAddress &&
                      formData.shippingAddress)) && (
                    <div className="border-t pt-4 mb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-[#814e1e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Bezorgadres
                        </h3>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {(() => {
                          // Show shipping address if "Verzenden naar een ander adres" is selected and shipping address is filled
                          if (
                            formData.useShippingAddress &&
                            (formData.shippingAddress ||
                              formData.shippingPostcode)
                          ) {
                            return (
                              <div>
                                {(formData.firstName || formData.lastName) && (
                                  <p className="font-medium text-gray-900">
                                    {formData.firstName} {formData.lastName}
                                  </p>
                                )}
                                {formData.shippingAddress ? (
                                  <>
                                    <p>
                                      {`${formData.shippingAddress} ${
                                        formData.shippingHouseNumber
                                      }${
                                        formData.shippingHouseAddition || ""
                                      }`.trim()}
                                    </p>
                                    <p>
                                      {formData.shippingPostcode}{" "}
                                      {formData.shippingCity}
                                    </p>
                                    <p>
                                      {(() => {
                                        switch (formData.shippingCountry) {
                                          case "NL":
                                            return "Nederland";
                                          case "BE":
                                            return "België";
                                          case "DE":
                                            return "Duitsland";
                                          default:
                                            return formData.shippingCountry;
                                        }
                                      })()}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-gray-400 italic">
                                    Verzendadres nog niet ingevuld
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // Otherwise show billing address (default behavior)
                          const selectedAddress = previousAddresses.find(
                            (addr) => addr.id === formData.selectedAddressId
                          );

                          if (selectedAddress) {
                            return (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {selectedAddress.fullName}
                                </p>
                                <p>
                                  {formData.billingAddress &&
                                  formData.billingHouseNumber
                                    ? `${formData.billingAddress} ${
                                        formData.billingHouseNumber
                                      }${
                                        formData.billingHouseAddition || ""
                                      }`.trim()
                                    : selectedAddress.street.replace(
                                        /\s+(\d+)\s+\1(?:\s|$)/,
                                        " $1"
                                      )}
                                </p>
                                <p>
                                  {selectedAddress.postalCode}{" "}
                                  {selectedAddress.city}
                                </p>
                                <p>
                                  {(() => {
                                    switch (selectedAddress.country) {
                                      case "NL":
                                        return "Nederland";
                                      case "BE":
                                        return "België";
                                      case "DE":
                                        return "Duitsland";
                                      default:
                                        return selectedAddress.country;
                                    }
                                  })()}
                                </p>
                              </div>
                            );
                          } else if (formData.billingAddress) {
                            // Fallback to manual address
                            return (
                              <div>
                                {(formData.firstName || formData.lastName) && (
                                  <p className="font-medium text-gray-900">
                                    {formData.firstName} {formData.lastName}
                                  </p>
                                )}
                                <p>
                                  {`${formData.billingAddress} ${
                                    formData.billingHouseNumber
                                  }${
                                    formData.billingHouseAddition || ""
                                  }`.trim()}
                                </p>
                                <p>
                                  {formData.billingPostcode}{" "}
                                  {formData.billingCity}
                                </p>
                                <p>
                                  {formData.billingCountry === "NL"
                                    ? "Nederland"
                                    : formData.billingCountry}
                                </p>
                              </div>
                            );
                          }
                          return (
                            <p className="text-gray-400 italic">
                              Nog geen adres geselecteerd
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex flex-wrap justify-between text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Subtotaal</span>
                      </div>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap justify-between text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                        </svg>
                        <span>Verzending</span>
                      </div>
                      <span>
                        {calculateShipping() === 0
                          ? "Gratis"
                          : `€${calculateShipping().toFixed(2)}`}
                      </span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex flex-wrap justify-between text-sm text-green-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Korting ({appliedDiscount.code})</span>
                        </div>
                        <span>-€{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {subtotal >= 75 && (
                      <div className="flex flex-wrap justify-between text-sm text-purple-600">
                        <span>Volume korting (10%)</span>
                        <span>-€{calculateVolumeDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#814e1e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Totaal</span>
                      </div>
                      <span>€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Loyalty Points Info */}
                  {isLoggedIn && user?.loyalty && (
                    <div className="mt-4">
                      <CheckoutLoyaltyInfo
                        orderTotal={subtotal}
                        onCouponSelect={async (couponCode) => {
                          // Apply the discount directly with the couponCode
                          setIsApplyingDiscount(true);
                          setDiscountError("");

                          try {
                            // Call WooCommerce API to validate coupon
                            const response = await fetch(
                              `/api/woocommerce/coupons/validate`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  coupon_code: couponCode,
                                  subtotal: subtotal,
                                }),
                              }
                            );

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(
                                errorData.message || "Ongeldige kortingscode"
                              );
                            }

                            const couponData = await response.json();

                            // Apply the discount
                            setAppliedDiscount({
                              code: couponCode,
                              amount: couponData.discount_amount,
                              type:
                                couponData.discount_type === "percent"
                                  ? "percentage"
                                  : "fixed",
                            });

                            // Clear the discount code field
                            setDiscountCode("");
                          } catch (error) {
                            console.error("Discount code error:", error);
                            setDiscountError(
                              error instanceof Error
                                ? error.message
                                : "Kortingscode kon niet worden toegepast"
                            );
                            setAppliedDiscount(null);
                          } finally {
                            setIsApplyingDiscount(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">
                          Veilig betalen met SSL-encryptie
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">
                          30 dagen bedenktijd
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19.5 12.5l-1.5-3h-3v-2c0-1.1-.9-2-2-2h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h.76c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h3.52c.55 1.19 1.74 2 3.24 2s2.69-.81 3.24-2h.76c.55 0 1-.45 1-1v-3.5c0-.83-.67-1.5-1.5-1.5zm-11.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3h-3v-2.5h2.5l.5 1v1.5z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          Gratis verzending vanaf €40
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Order Summary */}
                <div
                  id="mobile-order-summary"
                  className="bg-white rounded-lg p-6 shadow-sm lg:hidden hidden"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-[#814e1e]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h2 className="text-xl font-semibold">Orderoverzicht</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex flex-wrap gap-3">
                          <div className="relative flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={60}
                              height={60}
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap justify-between items-start mb-2">
                              <div>
                                <h3 className="text-sm font-medium">
                                  {item.title}
                                </h3>
                                {item.variant && (
                                  <p className="text-xs text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(item.id, item.variant)
                                }
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Product verwijderen"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex flex-wrap items-center justify-between">
                              <div className="flex flex-wrap items-center border border-gray-300 rounded">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.variant,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[40px] text-center">
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
                                  className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-sm font-medium">
                                <span className="text-gray-500">
                                  €{item.price.toFixed(2)} × {item.quantity} ={" "}
                                </span>
                                <span className="text-[#814e1e] font-semibold">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Address Display - Mobile */}
                  {(formData.billingAddress ||
                    formData.selectedAddressId ||
                    (formData.useShippingAddress &&
                      formData.shippingAddress)) && (
                    <div className="border-t pt-4 mb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-[#814e1e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Bezorgadres
                        </h3>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {(() => {
                          // Show shipping address if "Verzenden naar een ander adres" is selected and shipping address is filled
                          if (
                            formData.useShippingAddress &&
                            (formData.shippingAddress ||
                              formData.shippingPostcode)
                          ) {
                            return (
                              <div>
                                {(formData.firstName || formData.lastName) && (
                                  <p className="font-medium text-gray-900">
                                    {formData.firstName} {formData.lastName}
                                  </p>
                                )}
                                {formData.shippingAddress ? (
                                  <>
                                    <p>
                                      {`${formData.shippingAddress} ${
                                        formData.shippingHouseNumber
                                      }${
                                        formData.shippingHouseAddition || ""
                                      }`.trim()}
                                    </p>
                                    <p>
                                      {formData.shippingPostcode}{" "}
                                      {formData.shippingCity}
                                    </p>
                                    <p>
                                      {(() => {
                                        switch (formData.shippingCountry) {
                                          case "NL":
                                            return "Nederland";
                                          case "BE":
                                            return "België";
                                          case "DE":
                                            return "Duitsland";
                                          default:
                                            return formData.shippingCountry;
                                        }
                                      })()}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-gray-400 italic">
                                    Verzendadres nog niet ingevuld
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // Otherwise show billing address (default behavior)
                          const selectedAddress = previousAddresses.find(
                            (addr) => addr.id === formData.selectedAddressId
                          );

                          if (selectedAddress) {
                            return (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {selectedAddress.fullName}
                                </p>
                                <p>
                                  {formData.billingAddress &&
                                  formData.billingHouseNumber
                                    ? `${formData.billingAddress} ${
                                        formData.billingHouseNumber
                                      }${
                                        formData.billingHouseAddition || ""
                                      }`.trim()
                                    : selectedAddress.street.replace(
                                        /\s+(\d+)\s+\1(?:\s|$)/,
                                        " $1"
                                      )}
                                </p>
                                <p>
                                  {selectedAddress.postalCode}{" "}
                                  {selectedAddress.city}
                                </p>
                                <p>
                                  {(() => {
                                    switch (selectedAddress.country) {
                                      case "NL":
                                        return "Nederland";
                                      case "BE":
                                        return "België";
                                      case "DE":
                                        return "Duitsland";
                                      default:
                                        return selectedAddress.country;
                                    }
                                  })()}
                                </p>
                              </div>
                            );
                          } else if (formData.billingAddress) {
                            // Fallback to manual address
                            return (
                              <div>
                                {(formData.firstName || formData.lastName) && (
                                  <p className="font-medium text-gray-900">
                                    {formData.firstName} {formData.lastName}
                                  </p>
                                )}
                                <p>
                                  {`${formData.billingAddress} ${
                                    formData.billingHouseNumber
                                  }${
                                    formData.billingHouseAddition || ""
                                  }`.trim()}
                                </p>
                                <p>
                                  {formData.billingPostcode}{" "}
                                  {formData.billingCity}
                                </p>
                                <p>
                                  {formData.billingCountry === "NL"
                                    ? "Nederland"
                                    : formData.billingCountry}
                                </p>
                              </div>
                            );
                          }
                          return (
                            <p className="text-gray-400 italic">
                              Nog geen adres geselecteerd
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex flex-wrap justify-between text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Subtotaal</span>
                      </div>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap justify-between text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                        </svg>
                        <span>Verzending</span>
                      </div>
                      <span>
                        {calculateShipping() === 0
                          ? "Gratis"
                          : `€${calculateShipping().toFixed(2)}`}
                      </span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex flex-wrap justify-between text-sm text-green-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Korting ({appliedDiscount.code})</span>
                        </div>
                        <span>-€{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {subtotal >= 75 && (
                      <div className="flex flex-wrap justify-between text-sm text-purple-600">
                        <span>Volume korting (10%)</span>
                        <span>-€{calculateVolumeDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex flex-wrap justify-between font-semibold">
                      <div className="flex flex-wrap items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#814e1e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Totaal</span>
                      </div>
                      <span>€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Loyalty Points Info - Mobile */}
                  {isLoggedIn && user?.loyalty && (
                    <div className="mt-4">
                      <CheckoutLoyaltyInfo
                        orderTotal={subtotal}
                        onCouponSelect={async (couponCode) => {
                          // Apply the discount directly with the couponCode
                          setIsApplyingDiscount(true);
                          setDiscountError("");

                          try {
                            // Call WooCommerce API to validate coupon
                            const response = await fetch(
                              `/api/woocommerce/coupons/validate`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  coupon_code: couponCode,
                                  subtotal: subtotal,
                                }),
                              }
                            );

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(
                                errorData.message || "Ongeldige kortingscode"
                              );
                            }

                            const couponData = await response.json();

                            // Apply the discount
                            setAppliedDiscount({
                              code: couponCode,
                              amount: couponData.discount_amount,
                              type:
                                couponData.discount_type === "percent"
                                  ? "percentage"
                                  : "fixed",
                            });

                            // Clear the discount code field
                            setDiscountCode("");
                          } catch (error) {
                            console.error("Discount code error:", error);
                            setDiscountError(
                              error instanceof Error
                                ? error.message
                                : "Kortingscode kon niet worden toegepast"
                            );
                            setAppliedDiscount(null);
                          } finally {
                            setIsApplyingDiscount(false);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-[#814e1e] text-white py-8 mt-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-4">
                100% Tevredenheidsgarantie
              </h2>
              <p className="text-lg mb-6">
                Niet tevreden? Geen probleem! Je krijgt binnen 30 dagen je geld
                terug.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Geen gedoe</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Geen vragen</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>100% terugbetaling</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Testimonials Section */}
        {/* <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Wat klanten zeggen
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#F4F2EB] p-6 rounded-lg">
                <div className="flex flex-wrap mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  "Heerlijke geuren die lang blijven hangen. De verzending was
                  snel en het product was prachtig verpakt!"
                </p>
                <p className="text-sm font-medium">- Maria K.</p>
              </div>
              <div className="bg-[#F4F2EB] p-6 rounded-lg">
                <div className="flex flex-wrap mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  "Eindelijk een wasparfum dat niet te overheersend is. Perfect
                  voor mijn gevoelige huid!"
                </p>
                <p className="text-sm font-medium">- Jan V.</p>
              </div>
              <div className="bg-[#F4F2EB] p-6 rounded-lg">
                <div className="flex flex-wrap mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  "Geweldige service en snelle levering. Ik bestel hier zeker
                  weer!"
                </p>
                <p className="text-sm font-medium">- Sophie T.</p>
              </div>
            </div>
          </div>
        </div> */}
        {/* <TestimonialsSection /> */}
        <div className="bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF7EC] py-16">
          <div className="container mx-auto p-4">
            <h2 className="text-3xl font-semibold text-center mb-10 text-gray-800">
              Wat klanten zeggen
            </h2>

            <Slider {...settings}>
              {testimonials.map((testimonial, i) => (
                <div key={i} className="px-3">
                  <div className="flex flex-col justify-between bg-[#F4F2EB] p-6 rounded-2xl transition-all duration-300 ease-in-out w-full min-h-[200px]">
                    <div>
                      <div className="flex flex-wrap mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-5 h-5 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-[15px] leading-relaxed italic mb-4">
                        "{testimonial.text}"
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 text-right">
                      {testimonial.author}
                    </p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>

        {/* Products Popup */}
        {showProductsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-wrap items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Alle producten
                </h2>
                <button
                  onClick={() => setShowProductsPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Products Grid */}
              <div className="p-6">
                <div
                  className="flex flex-wrap gap-4 overflow-x-auto pb-4"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {allProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4 border-2 cursor-pointer transition-all hover:border-[#814e1e]"
                      style={{
                        scrollSnapAlign: "start",
                        borderColor: selectedProducts.has(product.id)
                          ? "#814e1e"
                          : "#e5e7eb",
                      }}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      {/* Selection checkbox */}
                      <div className="flex flex-wrap items-center justify-between mb-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProducts.has(product.id)
                              ? "bg-[#814e1e] border-[#814e1e]"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedProducts.has(product.id) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>

                        {/* In cart indicator */}
                        {product.in_cart && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            In winkelwagen
                          </span>
                        )}
                      </div>

                      {/* Product image */}
                      <div className="w-full h-32 bg-white rounded-lg mb-3 overflow-hidden flex flex-wrap items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<span class="text-4xl">📦</span>';
                            }
                          }}
                        />
                      </div>

                      {/* Product info */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {product.title}
                          </h3>
                          {product.badge && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                product.badge.includes("Nieuw")
                                  ? "bg-blue-500"
                                  : product.badge.includes("Bestseller") ||
                                    product.badge.includes("#1")
                                  ? "bg-orange-500"
                                  : product.badge.includes("Premium")
                                  ? "bg-purple-500"
                                  : "bg-green-500"
                              }`}
                            >
                              {product.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between mb-2">
                          <p className="text-lg font-bold text-[#814e1e]">
                            €{product.price.toFixed(2)}
                          </p>

                          {/* Quantity Controls */}
                          <div
                            className="flex flex-wrap items-center border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking quantity
                          >
                            <button
                              onClick={() =>
                                updatePopupQuantity(
                                  product.id,
                                  Math.max(1, (product.quantity || 1) - 1)
                                )
                              }
                              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                              disabled={(product.quantity || 1) <= 1}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <span className="px-2 py-1 text-sm font-medium border-x border-gray-300 min-w-[32px] text-center">
                              {product.quantity || 1}
                            </span>
                            <button
                              onClick={() =>
                                updatePopupQuantity(
                                  product.id,
                                  (product.quantity || 1) + 1
                                )
                              }
                              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Total price for this product */}
                        {(product.quantity || 1) > 1 && (
                          <p className="text-xs text-gray-500">
                            Totaal: €
                            {(
                              (product.price || 0) * (product.quantity || 1)
                            ).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scroll hint */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    ← Scroll horizontaal om meer producten te zien →
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between p-6 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const selectedItems = allProducts.filter((p) =>
                      selectedProducts.has(p.id)
                    );
                    const totalQuantity = selectedItems.reduce(
                      (sum, p) => sum + (p.quantity || 1),
                      0
                    );
                    const totalPrice = selectedItems.reduce(
                      (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
                      0
                    );

                    if (selectedProducts.size === 0) {
                      return "Geen producten geselecteerd";
                    }

                    return (
                      <div>
                        <div>
                          {totalQuantity} item{totalQuantity !== 1 ? "s" : ""}{" "}
                          geselecteerd
                        </div>
                        <div className="font-semibold text-[#814e1e]">
                          Totaal: €{totalPrice.toFixed(2)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowProductsPopup(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={addSelectedProductsToCart}
                    disabled={selectedProducts.size === 0}
                    className="px-6 py-2 bg-[#814e1e] text-white rounded-lg hover:bg-[#6d3f18] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {selectedProducts.size > 0
                      ? `Toevoegen aan winkelwagen`
                      : "Selecteer producten"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auth Popup */}
        <CheckoutAuthPopup
          isOpen={showAuthPopup}
          onClose={() => setShowAuthPopup(false)}
          onSuccess={() => {
            setShowAuthPopup(false);
            // The form will automatically update thanks to the useEffect that watches for user changes
          }}
        />
      </div>
    </Suspense>
  );
}
