"use client";

import { useCart } from "context/CartContext";
import { Product } from "types/product";
import { useEffect, useState } from "react";

export default function TrialPackCard({
  TrialPackCardsData,
}: {
  TrialPackCardsData: Product | null;
}) {
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use cart hooks after component is mounted
  let addToCart: ((item: any) => void) | undefined;
  try {
    const cart = useCart();
    addToCart = cart.addToCart;
  } catch (error) {
    console.warn("Cart context not available, cart functionality disabled");
  }

  if (!TrialPackCardsData) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading Trail Pack Data product info...
      </div>
    );
  }

  // fallback image if product.images is empty
  const productImage =
    TrialPackCardsData.images && TrialPackCardsData.images.length > 0
      ? TrialPackCardsData.images[0]
      : "/figma/trial-pack-2.png";

  // parse price (your WooCommerce util probably already does this but just in case)
  const parsePrice = (price?: string) => {
    if (!price) return 0;
    return parseFloat(
      price.replace("€", "").replace("£", "").replace(",", ".")
    );
  };

  return (
    <div className="px-4 py-3 max-w-7xl mx-auto sm:px-6 lg:px-8 my-12 bg-white rounded-md p-6 md:p-12 lg:p-20 flex flex-col lg:flex-row gap-8 items-center justify-center">
      {/* Product Image */}
      <div className="w-full max-w-sm overflow-hidden relative">
        <img
          className="w-full h-auto rounded-md object-cover"
          src={productImage}
          alt={TrialPackCardsData.title}
        />
        {/* Badge */}
        <div className="absolute left-4 lg:left-4 top-6 bg-yellow-400 text-gray-900 font-bold text-xs md:text-sm px-3 py-1 rounded-full shadow">
          New Perfumes
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold font-serif text-gray-900">
            {TrialPackCardsData.title}
          </h2>
          <div
            className="text-gray-800 text-base md:text-lg leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html:
                TrialPackCardsData?.description ||
                "Looking for a little extra pampering? Try our newest collection featuring all of our new and most luxurious laundry perfumes.",
            }}
          />

          <div className="border-t border-yellow-600 my-2" />

          {TrialPackCardsData.attributes &&
            TrialPackCardsData.attributes.length > 0 && (
              <div className="text-sm md:text-base text-gray-900">
                <span className="font-bold">Includes:</span>{" "}
                {TrialPackCardsData.attributes
                  .map((attr) => `${attr.name}: ${attr.options.join(", ")}`)
                  .join(" • ")}
              </div>
            )}
        </div>

        {/* Actions */}
        <div
          className="flex sm:flex-row items-center justify-center w-full sm:w-1/2 gap-3 sm:gap-6 h-auto sm:h-12 rounded-md px-4 sm:px-6 py-3 sm:py-0 bg-gradient-to-l from-yellow-400 to-yellow-600 cursor-pointer"
          onClick={() => {
            if (mounted && addToCart && TrialPackCardsData) {
              addToCart({
                id: TrialPackCardsData.id,
                title: TrialPackCardsData.title,
                price: parsePrice(TrialPackCardsData.price),
                image: productImage,
              });
            }
          }}>
          <button className="uppercase text-base font-medium text-gray-900">
            Add to Cart
          </button>
          <span className="uppercase text-base font-medium text-gray-900">
            {TrialPackCardsData.price}
          </span>
        </div>
      </div>
    </div>
  );
}
