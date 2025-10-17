"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "context/AuthContext";

interface LoyaltyRedemptionProps {
  className?: string;
  onSuccess?: (couponCode: string, discountAmount: number) => void;
}

export default function LoyaltyRedemption({
  className = "",
  onSuccess,
}: LoyaltyRedemptionProps) {
  const { user, redeemPoints, checkRedeemEligibility, isLoading, error } =
    useAuth();
  const [eligibility, setEligibility] = useState({
    eligible: false,
    canRedeemTimes: 0,
    currentPoints: 0,
  });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    coupon_code?: string;
    discount_amount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Check eligibility on component mount and when user changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (user) {
        const result = await checkRedeemEligibility();
        setEligibility(result);
      }
    };

    checkEligibility();
  }, [user, checkRedeemEligibility]);

  const handleRedeem = async () => {
    if (!eligibility.eligible || isRedeeming) return;

    // Check for existing unused coupons first
    try {
      if (user?.email) {
        const response = await fetch(
          `/api/loyalty/coupons?email=${encodeURIComponent(user.email)}`
        );
        const result = await response.json();

        if (result.success && result.coupons && result.coupons.length > 0) {
          const confirmed = window.confirm(
            `Je hebt al ${result.coupons.length} ongebruikte kortingscode${
              result.coupons.length > 1 ? "s" : ""
            } ter waarde van €${result.total_discount_value.toFixed(2)}.\n\n` +
              `Weet je zeker dat je nog een nieuwe code wilt aanmaken?\n\n` +
              `Tip: Scroll naar beneden om je bestaande codes te bekijken en te gebruiken.`
          );

          if (!confirmed) {
            return;
          }
        }
      }
    } catch (error) {
      console.log(
        "Could not check existing coupons, proceeding with redemption"
      );
    }

    setIsRedeeming(true);
    setRedeemResult(null);

    try {
      const result = await redeemPoints();
      setRedeemResult(result);

      if (result.success && result.coupon_code && onSuccess) {
        onSuccess(result.coupon_code, result.discount_amount || 13);
      }

      // Refresh eligibility after redemption
      if (result.success) {
        const newEligibility = await checkRedeemEligibility();
        setEligibility(newEligibility);
      }
    } catch (error) {
      console.error("Redemption error:", error);
      setRedeemResult({
        success: false,
        error: "Er is een fout opgetreden bij het inwisselen van punten",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const clearResult = () => {
    setRedeemResult(null);
  };

  if (!user) {
    return (
      <div className={`bg-gray-100 p-4 rounded-lg ${className}`}>
        <p className="text-gray-600">
          Log in om je loyaliteitspunten in te wisselen
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-amber-900">
          Punten inwisselen
        </h3>
        <div className="text-sm text-amber-700">
          {eligibility.currentPoints} punten beschikbaar
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-amber-700">60 punten =</span>
          <span className="font-semibold text-amber-900">€13 korting</span>
        </div>

        {eligibility.canRedeemTimes > 0 && (
          <div className="text-xs text-amber-600">
            Je kunt {eligibility.canRedeemTimes}x inwisselen
          </div>
        )}
      </div>

      {/* Redemption Result Display */}
      {redeemResult && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            redeemResult.success
              ? "bg-green-100 border border-green-300"
              : "bg-red-100 border border-red-300"
          }`}
        >
          {redeemResult.success ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-800 font-medium">
                  ✅ Succesvol ingewisseld!
                </span>
                <button
                  onClick={clearResult}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  ✕
                </button>
              </div>
              {redeemResult.coupon_code && (
                <div className="bg-white p-3 rounded border-2 border-dashed border-green-400">
                  <div className="text-sm text-green-700 mb-1">
                    Je kortingscode:
                  </div>
                  <div className="font-mono text-lg font-bold text-green-900 select-all">
                    {redeemResult.coupon_code}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Geldig voor €{redeemResult.discount_amount} korting
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-800 font-medium">
                  ❌ Inwisseling mislukt
                </span>
                <button
                  onClick={clearResult}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-red-700">
                {redeemResult.error || "Er is een onbekende fout opgetreden"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && !redeemResult && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Redemption Button */}
      <button
        onClick={handleRedeem}
        disabled={!eligibility.eligible || isRedeeming || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          eligibility.eligible && !isRedeeming && !isLoading
            ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isRedeeming || isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
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
            Inwisselen...
          </span>
        ) : eligibility.eligible ? (
          "Wissel 60 punten in voor €13 korting"
        ) : eligibility.currentPoints < 60 ? (
          `Je hebt ${60 - eligibility.currentPoints} punten meer nodig`
        ) : (
          "Inwisselen niet mogelijk"
        )}
      </button>

      {/* Info Text */}
      <div className="mt-3 text-xs text-amber-600 text-center">
        {eligibility.eligible
          ? "Krijg direct een kortingscode voor je volgende bestelling"
          : "Verzamel meer punten door bestellingen te plaatsen"}
      </div>
    </div>
  );
}
