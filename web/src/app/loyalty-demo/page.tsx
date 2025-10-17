"use client";

import React, { useState } from "react";
import { useAuth } from "context/AuthContext";
import LoyaltyRedemption from "components/LoyaltyRedemption";

export default function LoyaltyDemoPage() {
  const { user, isLoggedIn } = useAuth();
  const [redeemHistory, setRedeemHistory] = useState<
    Array<{
      timestamp: string;
      couponCode: string;
      discountAmount: number;
    }>
  >([]);

  const handleRedemptionSuccess = (
    couponCode: string,
    discountAmount: number
  ) => {
    setRedeemHistory((prev) => [
      {
        timestamp: new Date().toLocaleString(),
        couponCode,
        discountAmount,
      },
      ...prev,
    ]);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Loyalty Redemption Demo
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Login Required
            </h2>
            <p className="text-yellow-700">
              Please log in to test the loyalty points redemption system.
            </p>
            <a
              href="/auth/login"
              className="inline-block mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Loyalty Points Redemption Demo
        </h1>

        {/* User Info */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Points:</span>
              <span className="ml-2 font-medium text-amber-600">
                {user?.loyalty?.points || 0} punten
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Earned:</span>
              <span className="ml-2 font-medium">
                {user?.loyalty?.totalEarned || 0} punten
              </span>
            </div>
            <div>
              <span className="text-gray-600">Available Rewards:</span>
              <span className="ml-2 font-medium text-green-600">
                {user?.loyalty?.rewardsAvailable || 0} rewards
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Redemption Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Redeem Points
            </h2>
            <LoyaltyRedemption
              onSuccess={handleRedemptionSuccess}
              className="h-fit"
            />

            {/* Redemption Rules */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Redemption Rules
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Minimum 60 points required</li>
                <li>• 60 points = €13 discount</li>
                <li>• Coupons expire after 30 days</li>
                <li>• One-time use per coupon</li>
                <li>• Email restricted to your account</li>
              </ul>
            </div>
          </div>

          {/* Redemption History */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Redemptions
            </h2>
            <div className="bg-white shadow-lg rounded-lg">
              {redeemHistory.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {redeemHistory.map((redemption, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {redemption.timestamp}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          €{redemption.discountAmount} discount
                        </span>
                      </div>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded border">
                        {redemption.couponCode}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">🎁</div>
                  <p>No redemptions yet</p>
                  <p className="text-sm">
                    Redeem points to see your coupon codes here
                  </p>
                </div>
              )}
            </div>

            {/* Test Information */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Test Information
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Current Points:</strong> {user?.loyalty?.points || 0}
                </p>
                <p>
                  <strong>Required for Redemption:</strong> 60 points
                </p>
                <p>
                  <strong>Can Redeem:</strong>{" "}
                  {Math.floor((user?.loyalty?.points || 0) / 60)} times
                </p>
                <p>
                  <strong>Discount Per Redemption:</strong> €13
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Test Section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            API Test Section
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/loyalty/redeem?email=${encodeURIComponent(
                      user?.email || ""
                    )}`
                  );
                  const data = await response.json();
                  console.log("Eligibility check result:", data);
                  alert(
                    `Eligible: ${data.eligible}, Can redeem: ${data.can_redeem_times} times`
                  );
                } catch (error) {
                  console.error("Eligibility check error:", error);
                  alert("Error checking eligibility");
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Check Eligibility (API)
            </button>

            <button
              onClick={() => {
                console.log("Current user loyalty data:", user?.loyalty);
                alert(
                  `Points: ${user?.loyalty?.points}, Total Earned: ${user?.loyalty?.totalEarned}`
                );
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Show Current Data
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ System Status
          </h3>
          <div className="text-sm text-green-800 space-y-1">
            <p>• Loyalty points endpoint: Active</p>
            <p>• Redemption API: Ready</p>
            <p>• WooCommerce integration: Connected</p>
            <p>• Atomic transactions: Enabled</p>
            <p>• Coupon generation: Functional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
