"use client";

import { useAuth } from "context/AuthContext";
import React, { useState, useEffect } from "react";
// import { useAuth } from '@/context/AuthContext';

interface LoyaltyCoupon {
  id: number;
  code: string;
  discount_amount: number;
  discount_type: string;
  usage_count: number;
  usage_limit: number;
  date_expires: string | null;
  date_created: string;
  redemption_date: string;
  description: string;
  is_used: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
}

interface LoyaltyCouponsProps {
  className?: string;
  onCouponCopied?: (couponCode: string) => void;
}

export default function LoyaltyCoupons({
  className = "",
  onCouponCopied,
}: LoyaltyCouponsProps) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<LoyaltyCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDiscountValue, setTotalDiscountValue] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Fetch coupons when component mounts or user changes
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!user || !user.email) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching loyalty coupons for: ${user.email}`);

        const response = await fetch(
          `/api/loyalty/coupons?email=${encodeURIComponent(user.email)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch coupons");
        }

        if (result.success) {
          setCoupons(result.coupons || []);
          setTotalDiscountValue(result.total_discount_value || 0);
        } else {
          throw new Error(result.error || "Failed to fetch coupons");
        }
      } catch (error) {
        console.error("Error fetching loyalty coupons:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load coupons"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [user?.email]);

  // Copy coupon code to clipboard
  const copyCouponCode = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopiedCoupon(couponCode);

      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedCoupon(null), 2000);

      if (onCouponCopied) {
        onCouponCopied(couponCode);
      }
    } catch (error) {
      console.error("Failed to copy coupon code:", error);
    }
  };

  // Invalidate a coupon
  const invalidateCoupon = async (couponId: number, couponCode: string) => {
    if (!user?.email) return;

    const confirmed = window.confirm(
      `Weet je zeker dat je kortingscode "${couponCode}" wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/loyalty/coupons?couponId=${couponId}&email=${encodeURIComponent(
          user.email
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        // Remove the coupon from the list
        setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
        setTotalDiscountValue(
          (prev) =>
            prev -
            (coupons.find((c) => c.id === couponId)?.discount_amount || 0)
        );
      } else {
        alert(
          "Kon kortingscode niet verwijderen: " +
            (result.error || "Onbekende fout")
        );
      }
    } catch (error) {
      console.error("Error invalidating coupon:", error);
      alert(
        "Er is een fout opgetreden bij het verwijderen van de kortingscode"
      );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get expiry status styling
  const getExpiryStatus = (coupon: LoyaltyCoupon) => {
    if (coupon.is_expired) {
      return { text: "Verlopen", class: "text-red-600 bg-red-50" };
    }

    if (coupon.days_until_expiry !== null) {
      if (coupon.days_until_expiry <= 3) {
        return {
          text: `Verloopt over ${coupon.days_until_expiry} dag${
            coupon.days_until_expiry !== 1 ? "en" : ""
          }`,
          class: "text-orange-600 bg-orange-50",
        };
      }
      return {
        text: `Geldig tot ${formatDate(coupon.date_expires!)}`,
        class: "text-green-600 bg-green-50",
      };
    }

    return { text: "Permanent geldig", class: "text-blue-600 bg-blue-50" };
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#814E1E]">
          Jouw kortingscodes
        </h3>
        {totalDiscountValue > 0 && (
          <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
            €{totalDiscountValue.toFixed(2)} totale korting beschikbaar
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-[#814E1E]"
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
            <span className="text-gray-600">Kortingscodes laden...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {!isLoading && !error && coupons.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎁</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Geen ongebruikte kortingscodes
          </h4>
          <p className="text-gray-600 mb-4">
            Je hebt momenteel geen ongebruikte kortingscodes. Wissel punten in
            om kortingscodes te krijgen!
          </p>
        </div>
      )}

      {!isLoading && !error && coupons.length > 0 && (
        <div className="space-y-4">
          {coupons.map((coupon) => {
            const expiryStatus = getExpiryStatus(coupon);

            return (
              <div
                key={coupon.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#D6AD61] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#D6AD61] text-white rounded-lg p-2">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#814E1E]">
                        €{coupon.discount_amount.toFixed(2)} korting
                      </h4>
                      <p className="text-sm text-gray-600">
                        Ingewisseld op {formatDate(coupon.redemption_date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${expiryStatus.class}`}
                    >
                      {expiryStatus.text}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Kortingscode:
                      </div>
                      <div className="font-mono text-lg font-bold text-[#814E1E] select-all">
                        {coupon.code}
                      </div>
                    </div>
                    <button
                      onClick={() => copyCouponCode(coupon.code)}
                      className="ml-3 px-3 py-2 bg-[#814E1E] text-white rounded-lg hover:bg-[#D6AD61] transition-colors text-sm"
                    >
                      {copiedCoupon === coupon.code ? (
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Gekopieerd!
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Kopiëren
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Gebruikt: {coupon.usage_count}/{coupon.usage_limit} keer
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => invalidateCoupon(coupon.id, coupon.code)}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && coupons.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tips voor gebruik:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Kopieer de code en gebruik deze bij checkout</li>
                <li>Codes zijn geldig voor 30 dagen na aanmaak</li>
                <li>Elke code kan maar één keer gebruikt worden</li>
                <li>Codes zijn alleen geldig voor jouw account</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
