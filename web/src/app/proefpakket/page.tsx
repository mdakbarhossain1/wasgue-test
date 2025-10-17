import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";
import { getProductBySlug } from "utils/woocommerce";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wasparfum Proefpakket | Wasgeurtje",
  description:
    "Ontdek jouw favoriete geur met ons proefpakket. 3 mini wasparfums voor slechts €9,95. Gratis verzending!",
};

// Fetch proefpakket product data
async function getProefpakketData() {
  try {
    // Fetch the main proefpakket product
    const proefpakket = await getProductBySlug("wasparfum-proefpakket");

    // Fetch related mini products
    const miniProducts = [
      await getProductBySlug("full-moon"),
      await getProductBySlug("blossom-drip"),
      await getProductBySlug("summer-vibes"),
    ].filter(Boolean);

    return { proefpakket, miniProducts };
  } catch (error) {
    console.error("Error fetching proefpakket data:", error);
    return { proefpakket: null, miniProducts: [] };
  }
}

export default async function ProefpakketPage() {
  const { proefpakket, miniProducts } = await getProefpakketData();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8F6F0" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#814E1E]/10 to-[#D6AD61]/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div
                className="inline-flex items-center px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: "#FCCE4E" }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "#814E1E" }}
                >
                  🎁 EXCLUSIEVE AANBIEDING
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: "#814E1E" }}
              >
                Ontdek jouw perfecte geur
              </h1>

              <p
                className="text-xl mb-8 leading-relaxed"
                style={{ color: "#814E1E", opacity: 0.8 }}
              >
                Niet zeker welke geur bij je past? Probeer ons proefpakket met 3
                mini wasparfums en ontdek jouw favoriet!
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#814E1E" }}>
                      3 verschillende geuren
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      Full Moon, Blossom Drip & Summer Vibes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#814E1E" }}>
                      Goed voor 15 wasbeurten
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      5 wasbeurten per mini flesje
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#814E1E" }}>
                      Gratis verzending
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      Vandaag besteld, morgen in huis
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: "#814E1E" }}
                  >
                    €9,95
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    Normaal €14,95
                  </p>
                </div>
                <Link
                  href="/wasparfum/wasparfum-proefpakket"
                  className="px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
                    color: "#212529",
                  }}
                >
                  BESTEL NU →
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#814E1E" }}
                >
                  <span>⭐⭐⭐⭐⭐</span>
                  <span>4.9/5 (1400+ reviews)</span>
                </div>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#814E1E" }}
                >
                  <span>✓</span>
                  <span>30 dagen retourgarantie</span>
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative">
              <div className="relative h-[600px] flex items-center justify-center">
                <Image
                  src={proefpakket?.image || "/figma/product-proefpakket.png"}
                  alt="Wasparfum Proefpakket"
                  width={500}
                  height={600}
                  className="object-contain"
                  priority
                />
              </div>
              {/* Floating badges */}
              <div className="absolute top-8 right-8 px-4 py-2 rounded-full shadow-lg bg-white">
                <span className="font-bold" style={{ color: "#814E1E" }}>
                  BESTSELLER
                </span>
              </div>
              <div
                className="absolute bottom-8 left-8 px-4 py-2 rounded-full shadow-lg"
                style={{ backgroundColor: "#FCCE4E" }}
              >
                <span className="font-bold text-sm">33% KORTING</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Included Scents Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: "#814E1E" }}
            >
              Wat zit er in het proefpakket?
            </h2>
            <p className="text-xl" style={{ color: "#814E1E", opacity: 0.8 }}>
              3 zorgvuldig geselecteerde topgeuren om uit te proberen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Full Moon */}
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="h-48 flex items-center justify-center mb-6">
                <Image
                  src="/figma/product-full-moon.png"
                  alt="Full Moon"
                  width={150}
                  height={180}
                  className="object-contain"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Full Moon
              </h3>
              <p className="text-gray-600 mb-4">
                Een mysterieuze, verleidelijke geur met tonen van witte musk en
                zachte bloemen
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Musk
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Jasmijn
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Sandelhout
                </span>
              </div>
            </div>

            {/* Blossom Drip */}
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="h-48 flex items-center justify-center mb-6">
                <Image
                  src="/figma/product-blossom-drip.png"
                  alt="Blossom Drip"
                  width={150}
                  height={180}
                  className="object-contain"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Blossom Drip
              </h3>
              <p className="text-gray-600 mb-4">
                Een frisse, bloemige explosie met kersenbloesem en een vleugje
                citrus
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Kersenbloesem
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Bergamot
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Roos
                </span>
              </div>
            </div>

            {/* Summer Vibes */}
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="h-48 flex items-center justify-center mb-6">
                <Image
                  src="/figma/product-summer-vibes.png"
                  alt="Summer Vibes"
                  width={150}
                  height={180}
                  className="object-contain"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Summer Vibes
              </h3>
              <p className="text-gray-600 mb-4">
                Een zonnige, energieke geur met tropische vruchten en kokos
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Kokos
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Mango
                </span>
                <span className="px-3 py-1 bg-[#F8F6F0] rounded-full text-sm">
                  Vanille
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: "#814E1E" }}
            >
              Hoe werkt het?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                1
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#814E1E" }}>
                Bestel het proefpakket
              </h3>
              <p className="text-sm text-gray-600">
                Voor slechts €9,95 inclusief gratis verzending
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                2
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#814E1E" }}>
                Test de geuren
              </h3>
              <p className="text-sm text-gray-600">
                Probeer elke geur 5 wasbeurten lang
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                3
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#814E1E" }}>
                Kies je favoriet
              </h3>
              <p className="text-sm text-gray-600">
                Ontdek welke geur perfect bij jou past
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                4
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#814E1E" }}>
                Bestel de grote fles
              </h3>
              <p className="text-sm text-gray-600">
                Met €5 korting op je eerste grote fles!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-bold text-center mb-12"
            style={{ color: "#814E1E" }}
          >
            Veelgestelde vragen
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "#814E1E" }}
              >
                Hoeveel wasbeurten kan ik doen met het proefpakket?
              </h3>
              <p style={{ color: "#814E1E", opacity: 0.8 }}>
                Het proefpakket bevat 3 mini flesjes van 5ml elk. Elk flesje is
                goed voor ongeveer 5 wasbeurten, dus in totaal kun je 15 keer
                wassen met verschillende geuren.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "#814E1E" }}
              >
                Krijg ik korting op mijn volgende bestelling?
              </h3>
              <p style={{ color: "#814E1E", opacity: 0.8 }}>
                Ja! Bij je proefpakket ontvang je een kortingscode voor €5
                korting op je eerste grote fles wasparfum.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "#814E1E" }}
              >
                Kan ik de geuren in het proefpakket zelf kiezen?
              </h3>
              <p style={{ color: "#814E1E", opacity: 0.8 }}>
                Het standaard proefpakket bevat onze 3 populairste geuren. Voor
                een meerprijs van €2 kun je tijdens het bestelproces je eigen 3
                geuren selecteren uit ons assortiment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-12 text-center text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #814E1E 0%, #D6AD61 100%)",
            }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Klaar om je perfecte geur te ontdekken?
            </h2>
            <p className="text-2xl mb-8 opacity-90">
              Bestel nu het proefpakket voor slechts €9,95
            </p>
            <Link
              href="/wasparfum/wasparfum-proefpakket"
              className="inline-block bg-white px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
              style={{ color: "#814E1E" }}
            >
              JA, IK WIL HET PROEFPAKKET!
            </Link>
            <p className="text-lg mt-6 opacity-90">
              ✓ Gratis verzending ✓ 30 dagen retourrecht ✓ Vandaag besteld,
              morgen in huis
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
