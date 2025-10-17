"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OrderManagement from "components/OrderManagement";

interface OrderDetails {
  orderId?: string;
  orderNumber?: string;
  paymentIntentId?: string;
  amount?: number;
  customerEmail?: string;
  status?: string;
  wooCommerceOrderId?: number;
  isCreating?: boolean;
  creationError?: string;
  orderData?: any; // Store the original order data for display
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageWrapper />
    </Suspense>
  );
}

const SuccessPageWrapper = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [productDetails, setProductDetails] = useState<any[]>([]);

  // Function to fetch product details by IDs
  const fetchProductDetails = async (lineItems: any[]) => {
    try {
      const productIds = lineItems.map((item) => item.id);
      console.log("🛍️ Fetching product details for IDs:", productIds);
      console.log("🛍️ LineItems:", lineItems);

      const response = await fetch(
        `/api/woocommerce/products?ids=${productIds.join(",")}`
      );
      console.log("🛍️ API Response status:", response.status);

      if (response.ok) {
        const products = await response.json();
        // DEBUG: ✅ Product details fetched:', products);

        // Map products with quantities from lineItems
        const productsWithQuantity = products.map((product: any) => {
          const lineItem = lineItems.find((item) => item.id == product.id); // Use == for loose comparison
          // DEBUG: Product mapping - productId, productTitle, productName, productImage, productImages, lineItemId, lineItemQuantity, allProductFields
          return {
            ...product,
            quantity: lineItem?.quantity || 1,
          };
        });

        console.log("📦 Final products with quantity:", productsWithQuantity);
        setProductDetails(productsWithQuantity);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch product details:",
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Error fetching product details:", error);
    }
  };

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent");
    const paymentIntentClientSecret = searchParams.get(
      "payment_intent_client_secret"
    );

    if (!paymentIntentId && !paymentIntentClientSecret) {
      setError("Geen betalingsinformatie gevonden");
      setLoading(false);
      return;
    }

    // First, verify the payment was actually successful
    if (paymentIntentId) {
      verifyPaymentStatus(paymentIntentId);
      return;
    }

    // This code has been moved to proceedWithSuccessFlow() function
  }, [searchParams]);

  // Fetch product details when orderData is available
  useEffect(() => {
    if (orderDetails.orderData?.lineItems) {
      fetchProductDetails(orderDetails.orderData.lineItems);
    }
  }, [orderDetails.orderData]);

  const verifyPaymentStatus = async (paymentIntentId: string) => {
    // DEBUG: 🔍 Verifying payment status for:', paymentIntentId);

    try {
      const response = await fetch(
        `/api/stripe/payment-status?payment_intent=${paymentIntentId}`
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment status");
      }

      const paymentStatus = await response.json();
      console.log("💳 Payment status:", paymentStatus);

      if (paymentStatus.status === "succeeded") {
        // DEBUG: ✅ Payment verified as successful, proceeding with order creation');
        proceedWithSuccessFlow(paymentIntentId);
      } else {
        // Payment failed or was cancelled - clear any stale data and show error
        console.log("❌ Payment not successful:", paymentStatus.status);
        sessionStorage.removeItem("successOrderData");

        let errorMessage = "Betaling is niet succesvol voltooid.";
        if (paymentStatus.status === "canceled") {
          errorMessage = "Betaling is geannuleerd.";
        } else if (paymentStatus.status === "requires_action") {
          errorMessage = "Betaling vereist nog actie.";
        } else if (paymentStatus.status === "requires_payment_method") {
          errorMessage = "Betaling mislukt - probeer een andere betaalmethode.";
        }

        setError(
          errorMessage + " Ga terug naar de checkout om opnieuw te proberen."
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error verifying payment status:", error);
      // Clear any stale data
      sessionStorage.removeItem("successOrderData");
      setError("Kon betalingsstatus niet verifiëren. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  const proceedWithSuccessFlow = (paymentIntentId: string) => {
    // Get success data from storage
    const successDataStr = sessionStorage.getItem("successOrderData");
    if (!successDataStr) {
      // Fallback: if we have a payment_intent but no session data, try to fetch payment details
      if (paymentIntentId) {
        console.log(
          "⚠️ No session data found, but payment_intent provided. Trying to fetch payment details..."
        );

        // Try to get payment details from Stripe
        fetch(`/api/stripe/payment-status?payment_intent=${paymentIntentId}`)
          .then((response) => response.json())
          .then((paymentStatus) => {
            // DEBUG: 📋 Payment status from Stripe:', paymentStatus);
            setOrderDetails({
              paymentIntentId: paymentIntentId,
              status: "completed",
              amount: paymentStatus.amount ? paymentStatus.amount / 100 : 0, // Convert from cents
            });
            setLoading(false);
          })
          .catch((error) => {
            console.error("Failed to fetch payment details:", error);
            setOrderDetails({
              paymentIntentId: paymentIntentId,
              status: "completed",
              amount: 0,
            });
            setLoading(false);
          });
        return;
      }

      setError("Geen bestelling data gevonden");
      setLoading(false);
      return;
    }

    try {
      const successData = JSON.parse(successDataStr);
      console.log("📦 Parsed sessionStorage data:", successData);

      const { orderData, paymentIntentId: storedPaymentIntentId } = successData;

      // Use the paymentIntentId from URL or fall back to stored one
      const finalPaymentIntentId = paymentIntentId || storedPaymentIntentId;

      // Validate orderData structure
      if (!orderData) {
        console.error("❌ OrderData is missing from sessionStorage");
        throw new Error("Order data ontbreekt");
      }

      // DEBUG: ✅ OrderData found:', orderData);
      // DEBUG: ✅ PaymentIntentId:', finalPaymentIntentId);

      // Set initial order details
      setOrderDetails({
        paymentIntentId: finalPaymentIntentId,
        amount: orderData?.finalTotal || orderData?.totals?.finalTotal,
        customerEmail: orderData?.customer?.email,
        isCreating: true,
        orderData: orderData, // Store the complete order data for display
      });

      // Check if order was already created by webhook, if not create it manually
      checkForExistingOrderOrCreate(orderData, finalPaymentIntentId);
    } catch (err) {
      console.error("Error parsing success data:", err);
      setError("Fout bij het verwerken van bestelling data");
      setLoading(false);
    }
  };

  const checkForExistingOrderOrCreate = async (
    orderData: any,
    paymentIntentId: string
  ) => {
    // DEBUG: 🔍 Checking if order already exists from webhook...');

    try {
      // First, check if webhook already created an order
      // Wait a moment for webhook processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to find existing order by payment intent ID
      const checkResponse = await fetch(
        `/api/woocommerce/orders/search?payment_intent=${paymentIntentId}`
      );

      if (checkResponse.ok) {
        const existingOrders = await checkResponse.json();
        if (existingOrders && existingOrders.length > 0) {
          // DEBUG: ✅ Found existing order created by webhook:', existingOrders[0]);

          // Update UI with existing order info - but keep orderData from sessionStorage
          setOrderDetails((prev) => ({
            ...prev,
            isCreating: false,
            wooCommerceOrderId: existingOrders[0].id,
            orderNumber: existingOrders[0].number,
            status: "completed",
            // Keep the orderData that was already set for address display
          }));

          sessionStorage.removeItem("successOrderData");
          setLoading(false);
          return; // Exit early, don't create duplicate
        }
      }

      console.log("ℹ️ No existing order found, trying webhook simulation...");
      // First try to simulate the webhook (for development)
      await simulateWebhookForDevelopment(paymentIntentId);

      // Check again if webhook simulation created the order
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait a bit longer

      const checkResponse2 = await fetch(
        `/api/woocommerce/orders/search?payment_intent=${paymentIntentId}`
      );
      if (checkResponse2.ok) {
        const existingOrders2 = await checkResponse2.json();
        if (existingOrders2 && existingOrders2.length > 0) {
          // DEBUG: ✅ Found order created by webhook simulation:', existingOrders2[0]);

          setOrderDetails((prev) => ({
            ...prev,
            isCreating: false,
            wooCommerceOrderId: existingOrders2[0].id,
            orderNumber: existingOrders2[0].number,
            status: "completed",
          }));

          sessionStorage.removeItem("successOrderData");
          setLoading(false);
          return;
        }
      }

      console.log("ℹ️ Webhook simulation failed, creating order manually...");
      // If webhook simulation also failed, create order manually
      await createWooCommerceOrder(orderData, paymentIntentId);
    } catch (error) {
      console.error("Error checking for existing order:", error);
      // Fallback to creating order manually
      await createWooCommerceOrder(orderData, paymentIntentId);
    }
  };

  const simulateWebhookForDevelopment = async (paymentIntentId: string) => {
    try {
      console.log("🧪 Simulating webhook for development...");

      const response = await fetch("/api/stripe/simulate-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // DEBUG: ✅ Webhook simulation successful:', result);
      } else {
        console.log("❌ Webhook simulation failed:", result);
      }

      return result;
    } catch (error) {
      console.error("💥 Error simulating webhook:", error);
      return null;
    }
  };

  const createWooCommerceOrder = async (
    orderData: any,
    paymentIntentId: string
  ) => {
    try {
      // Extract data from order data
      const lineItems = orderData.lineItems || [];
      const appliedDiscount = orderData.appliedDiscount;

      // Use totals from orderData if available, otherwise fallback to calculation
      const totals = orderData.totals || {
        subtotal: orderData.finalTotal || 0,
        discountAmount: appliedDiscount?.discount_amount || 0,
        volumeDiscount: 0,
        shippingCost: (orderData.finalTotal || 0) >= 40 ? 0 : 4.95,
        finalTotal: orderData.finalTotal || 0,
      };

      console.log("=== WooCommerce Order Creation Debug ===");
      console.log("📦 Order Data from sessionStorage:", orderData);
      console.log("💰 Calculated Totals:", totals);
      console.log("🛍️ Line Items:", lineItems);
      // DEBUG: 👤 Customer:', orderData.customer);
      console.log("🎫 Applied Discount:", appliedDiscount);
      console.log("💳 Payment Intent ID:", paymentIntentId);

      // Validate required fields
      if (!lineItems || lineItems.length === 0) {
        console.error("❌ Validation Error: No line items found");
        console.error("OrderData:", orderData);
        throw new Error("Geen producten gevonden in bestelling");
      }

      if (!orderData.customer) {
        console.error("❌ Validation Error: Customer object missing");
        console.error("OrderData:", orderData);
        throw new Error("Klantgegevens ontbreken");
      }

      if (!orderData.customer.email) {
        console.error("❌ Validation Error: Customer email missing");
        console.error("Customer object:", orderData.customer);
        throw new Error("Klant e-mail ontbreekt");
      }

      if (!paymentIntentId) {
        console.error("❌ Validation Error: Payment Intent ID missing");
        throw new Error("Payment Intent ID ontbreekt");
      }

      // DEBUG: ✅ Validation passed, sending to API...');

      const requestPayload = {
        lineItems,
        customer: orderData.customer,
        appliedDiscount,
        totals,
        paymentIntentId,
      };

      console.log(
        "📤 EXACT REQUEST PAYLOAD:",
        JSON.stringify(requestPayload, null, 2)
      );

      const response = await fetch("/api/woocommerce/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      console.log("📡 API Response Status:", response.status);
      console.log(
        "📡 API Response Headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.error("❌ Response not OK. Status:", response.status);
        console.error("❌ Response statusText:", response.statusText);

        let errorBody;
        const contentType = response.headers.get("content-type");
        console.error("❌ Response content-type:", contentType);

        try {
          // Clone the response so we can read it multiple times if needed
          const clonedResponse = response.clone();
          errorBody = await clonedResponse.text();
          console.error("❌ Raw error body:", errorBody);

          if (
            contentType &&
            contentType.includes("application/json") &&
            errorBody
          ) {
            try {
              const errorData = JSON.parse(errorBody);
              console.error("WooCommerce order creation API error:", errorData);
              throw new Error(
                errorData.error ||
                  errorData.message ||
                  `HTTP ${response.status}: ${response.statusText}`
              );
            } catch (parseError) {
              console.error("Failed to parse error as JSON:", parseError);
              throw new Error(
                `HTTP ${response.status}: ${errorBody || response.statusText}`
              );
            }
          } else {
            throw new Error(
              `HTTP ${response.status}: ${errorBody || response.statusText}`
            );
          }
        } catch (readError) {
          console.error("Failed to read error response:", readError);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Parse success response
      let result;
      try {
        const responseText = await response.text();
        console.log("📡 Raw success response:", responseText);
        result = JSON.parse(responseText);
        // DEBUG: ✅ WooCommerce order created successfully:', result);
      } catch (parseError) {
        console.error("❌ Failed to parse success response:", parseError);
        throw new Error("Invalid response from server");
      }

      // Update order details with success info
      setOrderDetails((prev) => ({
        ...prev,
        isCreating: false,
        wooCommerceOrderId: result.orderId,
        orderNumber: result.orderNumber,
        status: "completed",
      }));

      // Clear success data from storage
      sessionStorage.removeItem("successOrderData");
      setLoading(false);
    } catch (err) {
      console.error("Error creating WooCommerce order:", err);

      // For now, don't treat WooCommerce order creation errors as critical
      // The payment was successful, so show success page with a warning
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Onbekende fout bij het aanmaken van de bestelling";

      setOrderDetails((prev) => ({
        ...prev,
        isCreating: false,
        status: "completed", // Payment was successful
        creationError: `⚠️ Betaling geslaagd, maar: ${errorMessage}. Neem contact op met klantenservice met payment ID: ${paymentIntentId}`,
      }));

      setLoading(false);
    }
  };

  if (loading || orderDetails.isCreating) {
    return (
      <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="animate-spin w-8 h-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {orderDetails.isCreating
              ? "Bestelling aanmaken..."
              : "Betaling verwerken..."}
          </h2>
          <p className="text-gray-600">
            {orderDetails.isCreating
              ? "Je bestelling wordt aangemaakt in ons systeem. Dit duurt maar een paar seconden."
              : "We controleren je betalingsgegevens."}
          </p>
          {orderDetails.paymentIntentId && (
            <div className="mt-4 text-xs text-gray-500">
              Payment ID: {orderDetails.paymentIntentId.substring(0, 20)}...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F2EB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Main Error Card */}
            <div className="bg-white rounded-lg p-8 shadow-lg text-center mb-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oeps! Je betaling is niet doorgegaan
              </h1>

              <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>

              {/* Primary Action - Try Again */}
              <div className="space-y-4">
                <Link
                  href="/checkout"
                  className="w-full inline-block bg-[#814e1e] text-white py-4 px-6 rounded-lg hover:bg-[#6d3f18] transition-colors font-semibold text-lg shadow-lg"
                >
                  🔄 Probeer opnieuw met andere betaalmethode
                </Link>

                <div className="flex gap-3">
                  <Link
                    href="/wasparfum"
                    className="flex-1 inline-block bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                  >
                    🛍️ Verder winkelen
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 inline-block bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                  >
                    🏠 Naar homepage
                  </Link>
                </div>
              </div>
            </div>

            {/* Help & Support Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                💡 Veelvoorkomende oplossingen
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-[#814e1e] font-bold">•</span>
                  <span className="text-gray-700">
                    Controleer of je kaartgegevens correct zijn ingevuld
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#814e1e] font-bold">•</span>
                  <span className="text-gray-700">
                    Zorg dat je voldoende saldo hebt op je rekening
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#814e1e] font-bold">•</span>
                  <span className="text-gray-700">
                    Probeer een andere betaalmethode (iDEAL, creditcard)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#814e1e] font-bold">•</span>
                  <span className="text-gray-700">
                    Controleer of internationale betalingen zijn toegestaan
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 rounded-lg p-6 text-center mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                🤝 Hulp nodig?
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Ons team helpt je graag verder. We zijn beschikbaar op werkdagen
                van 9:00 tot 17:00.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="mailto:info@wasgeurtje.nl"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  📧 E-mail ons
                </a>
                <a
                  href="tel:+31123456789"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  📞 Bel ons
                </a>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="text-center">
              <div className="flex justify-center items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>100% Veilig</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>SSL Versleuteld</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>4.8★ (1400+ reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="min-h-screen bg-[#F4F2EB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="bg-white rounded-lg p-8 mb-6 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
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

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bedankt voor je bestelling! 🎉
              </h1>

              <p className="text-lg text-gray-600 mb-6">
                Je betaling is succesvol verwerkt en je bestelling is in
                behandeling genomen.
              </p>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                {orderDetails.wooCommerceOrderId && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bestelnummer:</p>
                    <p className="font-bold text-lg text-gray-900">
                      #
                      {orderDetails.orderNumber ||
                        orderDetails.wooCommerceOrderId}
                    </p>
                  </div>
                )}

                {orderDetails.paymentIntentId && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Betalings-ID:</p>
                    <p className="font-mono text-sm text-gray-900">
                      {orderDetails.paymentIntentId}
                    </p>
                  </div>
                )}

                {orderDetails.amount && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Betaald bedrag:
                    </p>
                    <p className="font-semibold text-gray-900">
                      €{orderDetails.amount.toFixed(2)}
                    </p>
                  </div>
                )}

                {orderDetails.creationError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800 font-medium mb-1">
                      ⚠️ Betalingsmelding:
                    </p>
                    <p className="text-sm text-yellow-700">
                      Je betaling is succesvol verwerkt, maar er was een
                      probleem bij het aanmaken van de bestelling:{" "}
                      {orderDetails.creationError}
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Neem contact met ons op met je betalings-ID hierboven.
                    </p>
                  </div>
                )}
              </div>

              {/* Show message if no order data available */}
              {!orderDetails.orderData && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6 text-center">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    🔍 Ordergegevens ophalen...
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Je bestelling wordt verwerkt. Gedetailleerde ordergegevens
                    zijn beschikbaar in je e-mailbevestiging.
                  </p>
                </div>
              )}

              {/* Customer & Order Information */}
              {orderDetails.orderData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Details */}
                  <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-6 text-xl border-b border-gray-200 pb-3">
                      Klantgegevens
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-gray-500 text-sm font-medium mb-1">
                          Naam:
                        </span>
                        <div className="font-bold text-gray-900 text-lg">
                          {orderDetails.orderData.customer?.firstName}{" "}
                          {orderDetails.orderData.customer?.lastName}
                        </div>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-sm font-medium mb-1">
                          E-mail:
                        </span>
                        <div className="font-semibold text-gray-900 text-base">
                          {orderDetails.orderData.customer?.email}
                        </div>
                      </div>
                      {orderDetails.orderData.customer?.phone && (
                        <div>
                          <span className="block text-gray-500 text-sm font-medium mb-1">
                            Telefoon:
                          </span>
                          <div className="font-semibold text-gray-900 text-base">
                            {orderDetails.orderData.customer?.phone}
                          </div>
                        </div>
                      )}
                      {orderDetails.orderData.customer?.businessOrder && (
                        <>
                          {orderDetails.orderData.customer?.companyName && (
                            <div>
                              <span className="block text-gray-500 text-sm font-medium mb-1">
                                Bedrijf:
                              </span>
                              <div className="font-semibold text-gray-900 text-base">
                                {orderDetails.orderData.customer.companyName}
                              </div>
                            </div>
                          )}
                          {orderDetails.orderData.customer?.vatNumber && (
                            <div>
                              <span className="block text-gray-500 text-sm font-medium mb-1">
                                BTW-nummer:
                              </span>
                              <div className="font-semibold text-gray-900 text-base">
                                {orderDetails.orderData.customer.vatNumber}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-6 text-xl border-b border-gray-200 pb-3">
                      Bezorgadres
                    </h3>
                    <div className="space-y-3">
                      <div className="font-bold text-gray-900 text-lg">
                        {orderDetails.orderData.customer?.firstName}{" "}
                        {orderDetails.orderData.customer?.lastName}
                      </div>
                      {orderDetails.orderData.customer?.companyName && (
                        <div className="text-gray-800 text-base font-medium">
                          {orderDetails.orderData.customer.companyName}
                        </div>
                      )}
                      <div className="text-gray-900 text-base leading-relaxed font-medium">
                        {orderDetails.orderData.customer?.useShippingAddress ? (
                          <>
                            <div className="mb-1">
                              {orderDetails.orderData.customer.shippingAddress}{" "}
                              {
                                orderDetails.orderData.customer
                                  .shippingHouseNumber
                              }
                              {
                                orderDetails.orderData.customer
                                  .shippingHouseAddition
                              }
                            </div>
                            <div className="mb-1">
                              {orderDetails.orderData.customer.shippingPostcode}{" "}
                              {orderDetails.orderData.customer.shippingCity}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-1">
                              {orderDetails.orderData.customer?.address}{" "}
                              {orderDetails.orderData.customer?.houseNumber}
                              {orderDetails.orderData.customer?.houseAddition}
                            </div>
                            <div className="mb-1">
                              {orderDetails.orderData.customer?.postcode}{" "}
                              {orderDetails.orderData.customer?.city}
                            </div>
                          </>
                        )}
                        <div className="text-gray-700 mt-2 font-medium">
                          Nederland
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {(orderDetails.orderData?.lineItems ||
                productDetails.length > 0) && (
                <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
                  <h3 className="font-bold text-gray-900 mb-6 text-xl border-b border-gray-200 pb-3">
                    Bestelde producten
                  </h3>
                  <div className="space-y-6">
                    {productDetails.length > 0
                      ? // Show detailed product info when available
                        productDetails.map((product: any, index: number) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-6 py-4 border-b border-gray-100 last:border-b-0"
                          >
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
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
                                      const sibling = e.currentTarget
                                        .nextElementSibling as HTMLElement | null;
                                      if (sibling)
                                        sibling.style.display = "flex";
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
                              <h4 className="font-bold text-gray-900 text-lg mb-2 truncate">
                                {product.title ||
                                  product.name ||
                                  `Product ID: ${product.id}`}
                              </h4>
                              <p className="text-base text-gray-700 font-medium mb-1">
                                Aantal: {product.quantity}
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                €{parseFloat(product.price || 0).toFixed(2)} per
                                stuk
                              </p>
                            </div>

                            {/* Total Price */}
                            <div className="flex-shrink-0 text-right">
                              <p className="font-bold text-gray-900 text-xl">
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
                        orderDetails.orderData?.lineItems?.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">
                                    Laden...
                                  </span>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 text-lg block">
                                    Product wordt geladen...
                                  </span>
                                  <span className="text-gray-700 text-base font-medium">
                                    Aantal: {item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}

                    {/* Order Totals */}
                    {orderDetails.orderData?.totals && (
                      <div className="pt-8 mt-8 border-t-2 border-gray-300 space-y-4 bg-gray-50 -mx-6 px-6 py-6 rounded-b-lg">
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-700 font-medium">
                            Subtotaal:
                          </span>
                          <span className="font-bold text-gray-900">
                            €
                            {orderDetails.orderData.totals.subtotal?.toFixed(2)}
                          </span>
                        </div>
                        {orderDetails.orderData.totals.discountAmount > 0 && (
                          <div className="flex justify-between text-lg text-green-600">
                            <span className="font-medium">Korting:</span>
                            <span className="font-bold">
                              -€
                              {orderDetails.orderData.totals.discountAmount.toFixed(
                                2
                              )}
                            </span>
                          </div>
                        )}
                        {orderDetails.orderData.totals.volumeDiscount > 0 && (
                          <div className="flex justify-between text-lg text-green-600">
                            <span className="font-medium">Volume korting:</span>
                            <span className="font-bold">
                              -€
                              {orderDetails.orderData.totals.volumeDiscount.toFixed(
                                2
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-700 font-medium">
                            Verzendkosten:
                          </span>
                          <span className="font-bold text-gray-900">
                            {orderDetails.orderData.totals.shippingCost === 0
                              ? "Gratis"
                              : `€${orderDetails.orderData.totals.shippingCost.toFixed(
                                  2
                                )}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-black text-2xl pt-4 border-t-2 border-gray-400 text-gray-900">
                          <span>Totaal:</span>
                          <span>
                            €
                            {orderDetails.orderData.totals.finalTotal?.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Wat gebeurt er nu?
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#814e1e] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Bevestiging per e-mail
                      </p>
                      <p className="text-sm text-gray-600">
                        Je ontvangt binnen enkele minuten een bevestiging van je
                        bestelling per e-mail.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#814e1e] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Bestelling voorbereiden
                      </p>
                      <p className="text-sm text-gray-600">
                        We bereiden je bestelling zorgvuldig voor in ons
                        magazijn.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#814e1e] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Verzending</p>
                      <p className="text-sm text-gray-600">
                        Je bestelling wordt zo snel mogelijk naar je verzonden.
                        Je ontvangt een track & trace code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Support */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Vragen over je bestelling?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Neem gerust contact met ons op als je vragen hebt over je
                  bestelling of onze producten.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-600">info@wasgeurtje.nl</span>
                  </div>
                  <div className="flex items-center gap-2"></div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Volg ons op social media
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Blijf op de hoogte van nieuwe producten en waslessen!
                </p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <span className="text-white text-sm font-bold">f</span>
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-sm font-bold">📷</span>
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="text-white text-sm font-bold">▶</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 bg-[#814e1e] text-white py-3 px-6 rounded-lg hover:bg-[#6d3f18] transition-colors text-center font-semibold"
              >
                Terug naar home
              </Link>
              <Link
                href="/shop"
                className="flex-1 border border-[#814e1e] text-[#814e1e] py-3 px-6 rounded-lg hover:bg-[#814e1e] hover:text-white transition-colors text-center font-semibold"
              >
                Verder winkelen
              </Link>
            </div>

            {/* Guarantee Banner */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="font-semibold text-green-900">
                  100% Tevredenheidsgarantie
                </h3>
              </div>
              <p className="text-sm text-green-800">
                Niet tevreden? Geen probleem! Je krijgt binnen 30 dagen je geld
                terug.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
