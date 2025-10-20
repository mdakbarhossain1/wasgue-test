"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "components/PaymentForm";
import {
  suppressStripeDevWarnings,
  stripeDefaultOptions,
} from "utils/stripe-config";

// Load Stripe
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (
    !publishableKey ||
    publishableKey === "pk_test_placeholder_for_development"
  ) {
    console.warn(
      "⚠️  Stripe publishable key not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local"
    );
    return null;
  }
  return loadStripe(publishableKey);
};

const stripePromise = getStripePromise();

interface PaymentPageProps {
  orderData: any;
  onError?: (error: string) => void;
}

export default function PaymentPage({ orderData, onError }: PaymentPageProps) {
  const router = useRouter();
  // const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [productDetails, setProductDetails] = useState<any[]>([]);

  // Function to fetch product details by IDs
  const fetchProductDetails = async (lineItems: any[]) => {
    try {
      const productIds = lineItems.map((item) => item.id);
      console.log("🛍️ Fetching product details for IDs:", productIds);

      const response = await fetch(
        `/api/woocommerce/products?ids=${productIds.join(",")}`
      );
      if (response.ok) {
        const products = await response.json();
        // DEBUG: ✅ Product details fetched:', products);

        // Map products with quantities from lineItems
        const productsWithQuantity = products.map((product: any) => {
          const lineItem = lineItems.find((item) => item.id == product.id);
          return {
            ...product,
            quantity: lineItem?.quantity || 1,
          };
        });

        setProductDetails(productsWithQuantity);
      } else {
        console.error("❌ Failed to fetch product details");
      }
    } catch (error) {
      console.error("❌ Error fetching product details:", error);
    }
  };

  useEffect(() => {
    // Suppress Stripe development warnings
    suppressStripeDevWarnings();

    // Use orderData passed as props
    if (!orderData) {
      console.error("No order data provided");
      setError(
        "Er is een fout opgetreden bij het laden van de betalingsgegevens"
      );
      setLoading(false);
      return;
    }

    // Create PaymentIntent
    createPaymentIntent(orderData);
  }, [orderData]);

  // Fetch product details when orderData is available
  useEffect(() => {
    if (orderData?.lineItems) {
      fetchProductDetails(orderData.lineItems);
    }
  }, [orderData]);

  const createPaymentIntent = async (data: any) => {
    try {
      const response = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create payment intent";
        let isSetupError = false;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          isSetupError = errorData.setup_required || false;
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        // If it's a setup error, show specific setup instructions
        if (isSetupError) {
          setError(
            `${errorMessage}\n\nSetup instructies:\n1. Maak een .env.local bestand in de web/ directory\n2. Voeg je Stripe test keys toe (zie STRIPE_ENV_SETUP.md)\n3. Herstart de development server`
          );
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);

      // Store order data for success page BEFORE payment (for async redirects like iDEAL)
      const successData = {
        orderData: data,
        paymentIntentId: result.paymentIntentId,
      };
      const serializedData = JSON.stringify(successData);
      sessionStorage.setItem("successOrderData", serializedData);
      // DEBUG: ✅ Order data stored in sessionStorage for success page:', successData);
      console.log("📦 Serialized data length:", serializedData.length);

      // Verify it was stored correctly
      const verifyData = sessionStorage.getItem("successOrderData");
      // DEBUG: ✅ Verified sessionStorage data exists:', !!verifyData);

      setLoading(false);
    } catch (err) {
      console.error("Error creating PaymentIntent:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Er is een fout opgetreden bij het voorbereiden van de betaling"
      );
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (successPaymentIntentId: string) => {
    // Store both order data and payment intent ID for success page
    const successData = {
      orderData,
      paymentIntentId: successPaymentIntentId,
    };
    sessionStorage.setItem("successOrderData", JSON.stringify(successData));

    // Always redirect to success page for consistent flow
    router.push(`/checkout/success?payment_intent=${successPaymentIntentId}`);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    if (onError) {
      onError(error);
    }
  };

  if (loading) {
    return (
      // <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
      <div>
        {/* <div className="bg-white rounded-lg p-8  max-w-md w-full mx-4"> */}
        <div className="bg-white w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">
            Betaling voorbereiden...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
      <div>
        <div className="bg-white rounded-lg p-8  max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Er is een fout opgetreden
          </h2>
          <div className="text-gray-600 mb-6 text-left">
            {error.split("\n").map((line, index) => (
              <p
                key={index}
                className={index === 0 ? "mb-2 font-medium" : "mb-1"}
              >
                {line}
              </p>
            ))}
          </div>
          <button
            onClick={() =>
              onError ? onError("User cancelled") : router.push("/checkout")
            }
            className="w-full bg-[#814e1e] text-white py-3 rounded-lg hover:bg-[#6d3f18] transition-colors"
          >
            Terug naar checkout
          </button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      // <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
      <div>
        <div className="bg-white rounded-lg p-8  max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Stripe Setup Vereist
          </h2>
          <div className="text-gray-600 mb-6 text-left">
            <p className="mb-2 font-medium">Stripe is niet geconfigureerd</p>
            <p className="mb-1">
              1. Maak een .env.local bestand in de web/ directory
            </p>
            <p className="mb-1">
              2. Voeg je Stripe keys toe (zie STRIPE_ENV_SETUP.md)
            </p>
            <p className="mb-1">3. Herstart de development server</p>
          </div>
          <button
            onClick={() =>
              onError
                ? onError("Stripe not configured")
                : router.push("/checkout")
            }
            className="w-full bg-[#814e1e] text-white py-3 rounded-lg hover:bg-[#6d3f18] transition-colors"
          >
            Terug naar checkout
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      // <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
      <div>
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4 text-center">
          <p className="text-gray-600">Betaling voorbereiden...</p>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret,
    ...stripeDefaultOptions,
  };

  return (
    // <div className="min-h-screen bg-[#F4F2EB]">
    <Suspense fallback={<div>Loading payment form...</div>}>
      {/* <div className="container mx-auto px-4 py-8"> */}
      <div className="container">
        {/* <div className="max-w-2xl mx-auto">  dsf*/}
        <div>
          {/* Header */}
          <div className="bg-white rounded-lg p-6 mb-6  border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Betaling voltooien
            </h1>
            <p className="text-gray-700 text-base font-medium">
              Voer je betaalgegevens in om de bestelling af te ronden
            </p>
          </div>

          {/* Order Summary */}
          {orderData && (
            <div className="bg-white rounded-lg p-6 mb-6  border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-6 text-xl border-b border-gray-200 pb-3">
                Orderoverzicht
              </h2>

              {/* Customer Info & Address */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Details */}
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">
                      Bestelling voor:
                    </p>
                    <p className="font-bold text-gray-900 text-lg">
                      {orderData.customer.firstName}{" "}
                      {orderData.customer.lastName}
                    </p>
                    <p className="text-base text-gray-700 font-medium">
                      {orderData.customer.email}
                    </p>
                    {orderData.customer.phone && (
                      <p className="text-base text-gray-700 font-medium">
                        {orderData.customer.phone}
                      </p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">
                      Bezorgadres:
                    </p>
                    <div className="text-base text-gray-900 font-medium leading-relaxed">
                      <div className="font-bold">
                        {orderData.customer.firstName}{" "}
                        {orderData.customer.lastName}
                      </div>
                      {orderData.customer.companyName && (
                        <div className="text-gray-700">
                          {orderData.customer.companyName}
                        </div>
                      )}
                      {orderData.customer.useShippingAddress ? (
                        <>
                          <div>
                            {orderData.customer.shippingAddress}{" "}
                            {orderData.customer.shippingHouseNumber}
                            {orderData.customer.shippingHouseAddition}
                          </div>
                          <div>
                            {orderData.customer.shippingPostcode}{" "}
                            {orderData.customer.shippingCity}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            {orderData.customer.address}{" "}
                            {orderData.customer.houseNumber}
                            {orderData.customer.houseAddition}
                          </div>
                          <div>
                            {orderData.customer.postcode}{" "}
                            {orderData.customer.city}
                          </div>
                        </>
                      )}
                      <div className="text-gray-600 mt-1">Nederland</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <p className="text-base text-gray-700 font-bold mb-4">
                  Producten:
                </p>
                <div className="space-y-4">
                  {productDetails.length > 0
                    ? // Show detailed product info when available
                      productDetails.map((product: any, index: number) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.title || product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log(
                                      "Image failed to load:",
                                      product.image
                                    );
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextElementSibling) {
                                      (
                                        e.currentTarget
                                          .nextElementSibling as HTMLElement
                                      ).style.display = "flex";
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                  Geen afbeelding
                                </div>
                              )}
                              <div
                                className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                                style={{
                                  display: product.image ? "none" : "flex",
                                }}
                              >
                                Geen afbeelding
                              </div>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-base mb-1 truncate">
                              {product.title ||
                                product.name ||
                                `Product ID: ${product.id}`}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">
                              Aantal: {product.quantity}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              €{parseFloat(product.price || 0).toFixed(2)} per
                              stuk
                            </p>
                          </div>

                          {/* Total Price */}
                          <div className="flex-shrink-0 text-right">
                            <p className="font-bold text-gray-900 text-base">
                              €
                              {(
                                parseFloat(product.price || 0) *
                                product.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    : // Fallback to basic product info while loading
                      orderData.lineItems.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">
                              Laden...
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="font-bold text-gray-900 text-base block">
                              Product wordt geladen...
                            </span>
                            <span className="text-gray-600 text-sm font-medium">
                              Aantal: {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-6 border-t-2 border-gray-300 bg-gray-50  px-6 py-4 rounded-b-lg">
                <div className="flex justify-between font-black text-xl text-gray-900">
                  <span>Totaal te betalen:</span>
                  <span>€{orderData.finalTotal?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          <div className="bg-white rounded-lg p-6  border border-gray-200">
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={orderData?.finalTotal || 0}
                customerEmail={orderData?.customer?.email}
                customerName={`${orderData?.customer?.firstName || ""} ${
                  orderData?.customer?.lastName || ""
                }`.trim()}
                customerPhone={orderData?.customer?.phone}
                customerCountry="NL"
              />
            </Elements>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Je betaalgegevens worden veilig verwerkt door Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
