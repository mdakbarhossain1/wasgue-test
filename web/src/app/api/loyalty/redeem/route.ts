import { NextRequest, NextResponse } from "next/server";
import { createLoyaltyCoupon } from "utils/coupon-api";

// Configuration
const WPLOYALTY_REDUCE_ENDPOINT =
  "https://wasgeurtje.nl/wp-json/wc/v3/wployalty/customers/points/reduce";
const REQUIRED_POINTS = 60;
const DISCOUNT_AMOUNT = 13; // €13 discount for 60 points

// WooCommerce API credentials
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY as string;
const WOOCOMMERCE_CONSUMER_SECRET = process.env
  .WOOCOMMERCE_CONSUMER_SECRET as string;

// Create WooCommerce authentication header
const getWooCommerceAuthHeader = () => {
  const authHeader =
    "Basic " +
    Buffer.from(
      `${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`
    ).toString("base64");
  return authHeader;
};

interface RedeemRequest {
  email: string;
  points: number;
}

interface RedeemResponse {
  success: boolean;
  message: string;
  coupon_code?: string;
  discount_amount?: number;
  remaining_points?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("===== LOYALTY POINTS REDEMPTION =====");

    // Parse request body
    const body: RedeemRequest = await request.json();
    const { email, points } = body;

    // Validation
    if (!email || !points) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and points are required",
        },
        { status: 400 }
      );
    }

    if (points < REQUIRED_POINTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum ${REQUIRED_POINTS} points required for redemption`,
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // DEBUG: Redeeming ${REQUIRED_POINTS} points for ${email}`);

    // Step 1: Reduce points via WPLoyalty API
    const reduceResponse = await fetch(WPLOYALTY_REDUCE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getWooCommerceAuthHeader(),
      },
      body: JSON.stringify({
        user_email: email,
        points: REQUIRED_POINTS,
      }),
    });

    // DEBUG: WPLoyalty reduce response status: ${reduceResponse.status}`);

    if (!reduceResponse.ok) {
      const errorText = await reduceResponse.text();
      console.error("DEBUG: WPLoyalty reduce error:", errorText);

      // Try to parse error for better message
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          {
            success: false,
            error: errorData.message || "Failed to reduce points",
          },
          { status: 400 }
        );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to process point reduction",
          },
          { status: 500 }
        );
      }
    }

    const reduceData = await reduceResponse.json();
    // DEBUG: WPLoyalty reduce response:', reduceData);

    if (!reduceData.success) {
      return NextResponse.json(
        {
          success: false,
          error: reduceData.message || "Point reduction failed",
        },
        { status: 400 }
      );
    }

    // Step 2: Create WooCommerce coupon
    let couponResult;
    try {
      couponResult = await createLoyaltyCoupon(email, DISCOUNT_AMOUNT);

      if (!couponResult.success) {
        // Rollback: Add points back if coupon creation fails
        // DEBUG: Coupon creation failed, attempting rollback...');

        try {
          const rollbackResponse = await fetch(
            "https://wasgeurtje.nl/wp-json/wc/v3/wployalty/customers/points/add",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: getWooCommerceAuthHeader(),
              },
              body: JSON.stringify({
                user_email: email,
                points: REQUIRED_POINTS,
              }),
            }
          );

          if (rollbackResponse.ok) {
            // DEBUG: Points successfully rolled back');
          } else {
            console.error("DEBUG: Failed to rollback points");
          }
        } catch (rollbackError) {
          console.error("DEBUG: Rollback error:", rollbackError);
        }

        return NextResponse.json(
          {
            success: false,
            error:
              couponResult.error ||
              "Failed to create coupon - points have been restored",
          },
          { status: 500 }
        );
      }
    } catch (couponError) {
      console.error("DEBUG: Coupon creation error:", couponError);

      // Rollback points on any error
      try {
        await fetch(
          "https://wasgeurtje.nl/wp-json/wc/v3/wployalty/customers/points/add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: getWooCommerceAuthHeader(),
            },
            body: JSON.stringify({
              user_email: email,
              points: REQUIRED_POINTS,
            }),
          }
        );
        // DEBUG: Points rolled back due to coupon error');
      } catch {
        console.error("DEBUG: Failed to rollback points after coupon error");
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create coupon - points have been restored",
        },
        { status: 500 }
      );
    }

    // Step 3: Get updated points balance
    let remainingPoints = points - REQUIRED_POINTS; // Fallback calculation
    try {
      const pointsResponse = await fetch(
        `https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=${encodeURIComponent(
          email
        )}`
      );
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        remainingPoints = pointsData.points || remainingPoints;
      }
    } catch (error) {
      // DEBUG: Could not fetch updated points, using calculation');
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "Points successfully redeemed!",
      coupon_code: couponResult.coupon_code,
      discount_amount: DISCOUNT_AMOUNT,
      remaining_points: remainingPoints,
      redeemed_points: REQUIRED_POINTS,
    });
  } catch (error) {
    console.error("DEBUG: Loyalty redeem API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during redemption",
      },
      { status: 500 }
    );
  }
}

// GET method to check redemption eligibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email parameter required",
        },
        { status: 400 }
      );
    }

    // Fetch current points
    const pointsEndpoint = `https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=${encodeURIComponent(
      email
    )}`;
    const pointsResponse = await fetch(pointsEndpoint);

    if (!pointsResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not fetch current points",
        },
        { status: 500 }
      );
    }

    const pointsData = await pointsResponse.json();
    const currentPoints = pointsData.points || 0;

    return NextResponse.json({
      success: true,
      current_points: currentPoints,
      required_points: REQUIRED_POINTS,
      discount_amount: DISCOUNT_AMOUNT,
      eligible: currentPoints >= REQUIRED_POINTS,
      can_redeem_times: Math.floor(currentPoints / REQUIRED_POINTS),
    });
  } catch (error) {
    console.error("DEBUG: Eligibility check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check redemption eligibility",
      },
      { status: 500 }
    );
  }
}
