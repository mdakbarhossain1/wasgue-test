"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "context/AuthContext";
import LoyaltyRedemption from "./LoyaltyRedemption";
import Link from "next/link";

interface CheckoutLoyaltyInfoProps {
  orderTotal: number;
  className?: string;
  onCouponSelect?: (couponCode: string) => void;
}

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

export default function CheckoutLoyaltyInfo({
  orderTotal,
  className = "",
  onCouponSelect,
}: CheckoutLoyaltyInfoProps) {
  const { user, isLoggedIn } = useAuth();
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [currentRedeemableCoupons, setCurrentRedeemableCoupons] = useState(0);
  const [totalAfterEarning, setTotalAfterEarning] = useState(0);
  const [possibleRedemptionsAfterOrder, setPossibleRedemptionsAfterOrder] =
    useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<LoyaltyCoupon[]>([]);
  const [showCouponSelector, setShowCouponSelector] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [showRedemptionPopup, setShowRedemptionPopup] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.loyalty) return;

    // Calculate points to earn (1 euro = 1 point)
    const earnedPoints = Math.round(orderTotal);
    setPointsToEarn(earnedPoints);

    // Calculate total points after this order
    const newTotal = user.loyalty.points + earnedPoints;
    setTotalAfterEarning(newTotal);

    // Calculate current redeemable coupons (60 points = 1 coupon)
    const currentCoupons = Math.floor(user.loyalty.points / 60);
    setCurrentRedeemableCoupons(currentCoupons);

    // Calculate possible redemptions after order
    const afterOrderCoupons = Math.floor(newTotal / 60);
    setPossibleRedemptionsAfterOrder(afterOrderCoupons);
  }, [orderTotal, user?.loyalty, isLoggedIn]);

  // Fetch coupons when popup opens
  useEffect(() => {
    if (showRedemptionPopup) {
      fetchCoupons();
    }
  }, [showRedemptionPopup]);

  // Fetch available coupons
  const fetchCoupons = async () => {
    if (!user?.email || isLoadingCoupons) return;

    setIsLoadingCoupons(true);
    try {
      const response = await fetch(
        `/api/loyalty/coupons?email=${encodeURIComponent(user.email)}`
      );
      const result = await response.json();

      if (result.success && result.coupons) {
        setAvailableCoupons(result.coupons);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // Handle coupon selection
  const handleCouponSelect = (
    couponCode: string,
    discountAmount: number = 13
  ) => {
    if (onCouponSelect) {
      onCouponSelect(couponCode);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      notification.style.animation = "fadeIn 0.3s ease-out";
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>✨ Kortingscode ${couponCode} is toegepast!</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Add animation if not exists
      if (!document.querySelector("#fadeInAnimation")) {
        const style = document.createElement("style");
        style.id = "fadeInAnimation";
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `;
        document.head.appendChild(style);
      }

      // Remove notification after 4 seconds
      setTimeout(() => {
        notification.remove();
      }, 4000);
    }
    setShowCouponSelector(false);
  };

  // Don't show for non-logged in users
  if (!isLoggedIn || !user?.loyalty) {
    return null;
  }

  const isCloseToRedemption = user.loyalty.points % 60 > 40; // Within 20 points of next redemption
  const willUnlockNewRedemption =
    possibleRedemptionsAfterOrder > currentRedeemableCoupons;

  return (
    <div
      className={`bg-gradient-to-br from-[#D6AD61]/10 to-[#814E1E]/10 border border-[#D6AD61]/20 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-[#D6AD61] rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#814E1E]">
            Loyalty Rewards
          </h3>
        </div>
        <button
          onClick={() => setShowRedemptionPopup(true)}
          className="text-xs text-[#814E1E] hover:text-[#D6AD61] transition-colors">
          Beheer punten →
        </button>
      </div>

      {/* Current Points */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-[#814E1E]">
            {user.loyalty.points}
          </div>
          <div className="text-xs text-gray-600">Huidige punten</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            +{pointsToEarn}
          </div>
          <div className="text-xs text-gray-600">Je verdient nu</div>
        </div>
      </div>

      {/* Clear summary */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Na deze bestelling:</span>
            <span className="font-semibold text-blue-800">
              {totalAfterEarning} punten totaal
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-700">Kortingscodes beschikbaar:</span>
            <span className="font-semibold text-green-700">
              {Math.floor(totalAfterEarning / 60)} × €13
            </span>
          </div>
        </div>
      </div>

      {/* Redemptions summary */}
      {willUnlockNewRedemption && (
        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-xs text-orange-800">
            <div className="font-semibold">
              🎉 Geweldig! Deze bestelling ontgrendelt:
            </div>
            <div className="mt-1">
              • {possibleRedemptionsAfterOrder - currentRedeemableCoupons}{" "}
              nieuwe kortingscode
              {possibleRedemptionsAfterOrder - currentRedeemableCoupons !== 1
                ? "s"
                : ""}{" "}
              van €13
              {currentRedeemableCoupons > 0 && (
                <span> (je hebt er al {currentRedeemableCoupons})</span>
              )}
            </div>
            <div className="text-orange-600 font-medium mt-1">
              Totaal na bestelling: {possibleRedemptionsAfterOrder} kortingscode
              {possibleRedemptionsAfterOrder !== 1 ? "s" : ""} beschikbaar
            </div>
          </div>
        </div>
      )}

      {/* Progress to next €13 discount */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Voortgang naar volgende €13 korting:
          </span>
          <span className="text-sm font-bold text-[#814E1E]">
            {totalAfterEarning % 60} / 60 punten
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-[#D6AD61] to-[#814E1E] h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, ((totalAfterEarning % 60) / 60) * 100)}%`,
            }}></div>
        </div>

        <div className="text-xs text-gray-600 text-center">
          {60 - (totalAfterEarning % 60) === 0
            ? "🎉 Je hebt genoeg punten voor een nieuwe korting!"
            : `Nog ${
                60 - (totalAfterEarning % 60)
              } punten nodig voor je volgende €13 korting`}
        </div>
      </div>

      {/* Smart messaging based on user's situation */}
      <div className="text-xs space-y-1">
        {currentRedeemableCoupons > 0 && (
          <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              {currentRedeemableCoupons} kortingscode
              {currentRedeemableCoupons !== 1 ? "s" : ""} beschikbaar (€
              {currentRedeemableCoupons * 13})
            </span>
          </div>
        )}

        {willUnlockNewRedemption && (
          <div className="flex items-center text-orange-700 bg-orange-50 px-2 py-1 rounded">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">
              🎉 Deze bestelling ontgrendelt{" "}
              {possibleRedemptionsAfterOrder - currentRedeemableCoupons} nieuwe
              korting
              {possibleRedemptionsAfterOrder - currentRedeemableCoupons !== 1
                ? "en"
                : ""}
              !
            </span>
          </div>
        )}

        {isCloseToRedemption && !willUnlockNewRedemption && (
          <div className="flex items-center text-blue-700 bg-blue-50 px-2 py-1 rounded">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Nog maar {60 - (user.loyalty.points % 60)} punten voor volgende
              €13 korting!
            </span>
          </div>
        )}

        {!isCloseToRedemption &&
          !willUnlockNewRedemption &&
          currentRedeemableCoupons === 0 && (
            <div className="text-gray-600">
              💡 Verdien punten met elke bestelling: €1 = 1 punt, 60 punten =
              €13 korting
            </div>
          )}
      </div>

      {/* Coupon selector */}
      {currentRedeemableCoupons > 0 && (
        <div className="mt-3 pt-3 border-t border-[#D6AD61]/20">
          {!showCouponSelector ? (
            <button
              onClick={() => {
                setShowCouponSelector(true);
                fetchCoupons();
              }}
              className="w-full text-xs text-center py-2 px-3 bg-[#814E1E] text-white rounded hover:bg-[#D6AD61] transition-colors">
              ✨ {currentRedeemableCoupons} kortingscode
              {currentRedeemableCoupons !== 1 ? "s" : ""} beschikbaar
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#814E1E]">
                  Klik op een code om direct €13 korting te krijgen:
                </span>
                <button
                  onClick={() => setShowCouponSelector(false)}
                  className="text-xs text-gray-500 hover:text-[#814E1E]">
                  ✕
                </button>
              </div>

              {isLoadingCoupons ? (
                <div className="text-xs text-center py-3 text-gray-500">
                  <div className="flex items-center justify-center space-x-1">
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Laden...</span>
                  </div>
                </div>
              ) : availableCoupons.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableCoupons.map((coupon) => (
                    <button
                      key={coupon.id}
                      onClick={() =>
                        handleCouponSelect(coupon.code, coupon.discount_amount)
                      }
                      className="w-full text-left p-2 bg-white border border-[#D6AD61]/30 rounded text-xs hover:bg-[#D6AD61]/10 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-mono font-medium text-[#814E1E]">
                            {coupon.code}
                          </div>
                          <div className="text-gray-600">
                            €{coupon.discount_amount} korting
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#814E1E] font-medium">
                            Gebruik deze code →
                          </div>
                          {coupon.days_until_expiry !== null && (
                            <div className="text-gray-500 text-xs">
                              {coupon.days_until_expiry <= 3
                                ? `Verloopt over ${
                                    coupon.days_until_expiry
                                  } dag${
                                    coupon.days_until_expiry !== 1 ? "en" : ""
                                  }`
                                : `Geldig ${coupon.days_until_expiry} dagen`}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-center py-3 text-gray-500">
                    Geen kortingscodes beschikbaar
                  </div>
                  {user.loyalty.points >= 60 && (
                    <button
                      onClick={() => {
                        setShowCouponSelector(false);
                        setShowRedemptionPopup(true);
                      }}
                      className="w-full text-xs text-center py-2 px-3 bg-[#D6AD61] text-white rounded hover:bg-[#814E1E] transition-colors">
                      💰 Wissel 60 punten in voor €13 korting
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional incentive for higher orders */}
      {orderTotal < 75 && (
        <div className="mt-2 text-xs text-center text-gray-600">
          💰 Bestel voor €{(75 - orderTotal).toFixed(2)} meer en krijg 10%
          volume korting!
        </div>
      )}

      {/* Redemption Popup */}
      {showRedemptionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Loyalty Punten Verzilveren
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Je hebt {user.loyalty.points} punten • 60 punten = €13 korting
                </p>
              </div>
              <button
                onClick={() => setShowRedemptionPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg
                  className="w-6 h-6"
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

            {/* Popup Content */}
            <div className="p-6">
              <LoyaltyRedemption
                onSuccess={(couponCode, discountAmount) => {
                  // Apply the new coupon automatically
                  if (onCouponSelect) {
                    onCouponSelect(couponCode);

                    // Show success message and close popup after a short delay
                    setTimeout(() => {
                      setShowRedemptionPopup(false);

                      // Alert user that coupon has been applied
                      const successMessage = document.createElement("div");
                      successMessage.className =
                        "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
                      successMessage.style.animation = "fadeIn 0.3s ease-out";
                      successMessage.innerHTML = `
                        <div class="flex items-center space-x-2">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>✨ Kortingscode ${couponCode} is toegepast! Je bespaart €${discountAmount}</span>
                        </div>
                      `;
                      document.body.appendChild(successMessage);

                      // Add keyframe animation
                      const style = document.createElement("style");
                      style.textContent = `
                        @keyframes fadeIn {
                          from { opacity: 0; transform: translate(-50%, -10px); }
                          to { opacity: 1; transform: translate(-50%, 0); }
                        }
                      `;
                      document.head.appendChild(style);

                      // Remove message after 4 seconds
                      setTimeout(() => {
                        successMessage.remove();
                        style.remove();
                      }, 4000);
                    }, 500);
                  }

                  // Refresh coupons
                  fetchCoupons();

                  // Close coupon selector if it was open
                  if (showCouponSelector) {
                    setShowCouponSelector(false);
                  }
                }}
              />

              {/* Existing Coupons Display */}
              {availableCoupons.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Beschikbare kortingscodes
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-mono font-medium text-gray-900">
                              {coupon.code}
                            </div>
                            <div className="text-sm text-gray-600">
                              €{coupon.discount_amount} korting
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleCouponSelect(
                                coupon.code,
                                coupon.discount_amount
                              );
                              setShowRedemptionPopup(false);
                            }}
                            className="px-3 py-1 bg-[#814E1E] text-white text-sm rounded hover:bg-[#D6AD61] transition-colors">
                            Toepassen
                          </button>
                        </div>
                        {coupon.days_until_expiry !== null && (
                          <div className="text-xs text-gray-500 mt-1">
                            {coupon.days_until_expiry <= 3
                              ? `Verloopt over ${coupon.days_until_expiry} dag${
                                  coupon.days_until_expiry !== 1 ? "en" : ""
                                }`
                              : `Geldig ${coupon.days_until_expiry} dagen`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
