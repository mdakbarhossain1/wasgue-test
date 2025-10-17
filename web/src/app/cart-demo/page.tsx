"use client";

import { useCart } from "context/CartContext";
import Image from "next/image";

export default function CartDemoPage() {
  const { addToCart } = useCart();

  const demoProducts = [
    {
      id: "full-moon",
      title: "Full Moon",
      price: 24.95,
      originalPrice: 29.95,
      image: "/figma/products/product-full-moon.png",
      description: "Een mystieke geur met tonen van jasmijn en sandelhout",
    },
    {
      id: "flower-rain",
      title: "Flower Rain",
      price: 22.95,
      image: "/figma/products/product-flower-rain.png",
      description: "Frisse bloemengeur met hints van roos en pioenroos",
    },
    {
      id: "sweet-fog",
      title: "Sweet Fog",
      price: 23.95,
      image: "/figma/products/product-sweet-fog.png",
      description: "Zoete en warme geur met vanille en karamel",
    },
    {
      id: "1893", // Valid WooCommerce product ID
      title: "Proefpakket - 5 Geuren",
      price: 19.95,
      originalPrice: 24.95,
      image: "/figma/products/trial-pack.png",
      description:
        "Ontdek onze 5 populairste geuren in handige proefverpakkingen",
    },
  ];

  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold font-[\'EB_Garamond\'] text-[#212529] mb-4">
            Cart Demo - Test de Winkelwagen
          </h1>
          <p className="text-lg text-gray-600">
            Klik op "Toevoegen aan winkelwagen" om de hoog converterende sidebar
            cart te testen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#d6ad61] rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className="relative h-64 bg-gray-50">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain p-4"
                />
                {product.originalPrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    SALE
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#814e1e] mb-2">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xl font-bold text-[#212529]">
                      €{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        €{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-[#814e1e] text-white py-3 rounded-full hover:bg-[#6d3f18] transition-colors font-semibold"
                >
                  Toevoegen aan winkelwagen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-[#f8f5f1] rounded-lg p-8">
          <h2 className="text-2xl font-semibold font-[\'EB_Garamond\'] text-[#212529] mb-4">
            Conversie Optimalisatie Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">✅ Gratis Verzending Bar</h3>
              <p className="text-sm text-gray-600">
                Dynamische voortgangsbalk die klanten motiveert om meer te
                bestellen voor gratis verzending
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🛒 Cart Badge</h3>
              <p className="text-sm text-gray-600">
                Real-time update van aantal items in de winkelwagen met
                opvallende badge
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💡 Cross-sell Suggesties</h3>
              <p className="text-sm text-gray-600">
                Slimme productaanbevelingen om de gemiddelde orderwaarde te
                verhogen
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎯 Trust Badges</h3>
              <p className="text-sm text-gray-600">
                Vertrouwenselementen zoals veilig betalen, snelle verzending en
                retourgarantie
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-gray-600">
                Perfect geoptimaliseerd voor alle apparaten met smooth animaties
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                💳 Multiple Checkout Options
              </h3>
              <p className="text-sm text-gray-600">
                Directe checkout en PayPal Express voor snellere conversie
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
