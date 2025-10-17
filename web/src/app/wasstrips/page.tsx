import Image from "next/image";
import Link from "next/link";
import { getProductBySlug } from "utils/woocommerce";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wasstrips | Wasgeurtje",
  description:
    "Ontdek onze innovatieve wasstrips. Compact, krachtig en milieuvriendelijk. De toekomst van wassen!",
};

export default async function WasstripsPage() {
  // Fetch wasstrips product data
  const wasstrips = await getProductBySlug("wasgeurtje-wasstrips");

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8F6F0" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#814E1E]/5 to-[#D6AD61]/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div
                className="inline-flex items-center px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: "rgba(129, 78, 30, 0.1)" }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "#814E1E" }}
                >
                  🌿 INNOVATIE IN WASSEN
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: "#814E1E" }}
              >
                De Revolutie in Wassen: Wasstrips
              </h1>

              <p
                className="text-xl mb-8 leading-relaxed"
                style={{ color: "#814E1E", opacity: 0.8 }}
              >
                Compact, krachtig en 100% oplosbaar. Onze wasstrips zijn de
                milieuvriendelijke toekomst van wassen. Geen plastic, geen
                rommel, alleen pure waskracht!
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#FCCE4E" }}
                  >
                    <span className="text-xl">🌍</span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#814E1E" }}
                    >
                      Zero Waste
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      100% biologisch afbreekbaar en plasticvrij
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#FCCE4E" }}
                  >
                    <span className="text-xl">💪</span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#814E1E" }}
                    >
                      Krachtig
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      Verwijdert vlekken en vuil effectief
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#FCCE4E" }}
                  >
                    <span className="text-xl">✈️</span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#814E1E" }}
                    >
                      Reisklaar
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      Perfect voor vakantie en onderweg
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#FCCE4E" }}
                  >
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#814E1E" }}
                    >
                      Voorgedoseerd
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "#814E1E", opacity: 0.7 }}
                    >
                      Geen overdosering, altijd perfect
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/wasparfum/wasgeurtje-wasstrips"
                  className="px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)",
                    color: "#212529",
                  }}
                >
                  PROBEER NU →
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#814E1E" }}
                    >
                      €12,95
                    </p>
                    <p className="text-sm text-gray-500">32 wasbeurten</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative">
              <div className="relative h-[600px] flex items-center justify-center">
                <Image
                  src={wasstrips?.image || "/figma/product-wasstrips.png"}
                  alt="Wasgeurtje Wasstrips"
                  width={500}
                  height={600}
                  className="object-contain"
                  priority
                />
              </div>
              {/* Floating elements */}
              <div className="absolute top-8 right-8 px-4 py-2 rounded-full shadow-lg bg-white">
                <span
                  className="font-bold text-sm"
                  style={{ color: "#814E1E" }}
                >
                  ECO-FRIENDLY
                </span>
              </div>
              <div
                className="absolute bottom-8 left-8 px-4 py-2 rounded-full shadow-lg"
                style={{ backgroundColor: "#FCCE4E" }}
              >
                <span className="font-bold text-sm">NIEUW!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: "#814E1E" }}
            >
              Zo Simpel Als 1-2-3
            </h2>
            <p className="text-xl" style={{ color: "#814E1E", opacity: 0.8 }}>
              Wassen was nog nooit zo makkelijk
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                1️⃣
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Pak een strip
              </h3>
              <p className="text-gray-600">
                Haal één wasstrip uit de verpakking. Dat is alles wat je nodig
                hebt voor een volle was!
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                2️⃣
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Gooi in de trommel
              </h3>
              <p className="text-gray-600">
                Plaats de strip direct in de wastrommel bij je kleding. Geen
                gedoe met doseerbakjes!
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: "#F8F6F0" }}
              >
                3️⃣
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "#814E1E" }}
              >
                Start je was
              </h3>
              <p className="text-gray-600">
                Start je normale wasprogramma. De strip lost volledig op en laat
                geen residu achter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-4xl font-bold mb-8"
                style={{ color: "#814E1E" }}
              >
                Waarom kiezen voor wasstrips?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(214, 173, 97, 0.2)" }}
                  >
                    <span style={{ color: "#D6AD61", fontSize: "24px" }}>
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#814E1E" }}
                    >
                      94% minder plastic
                    </h3>
                    <p className="text-gray-600">
                      Onze verpakking is minimaal en volledig recyclebaar. Geen
                      grote plastic flessen meer!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(214, 173, 97, 0.2)" }}
                  >
                    <span style={{ color: "#D6AD61", fontSize: "24px" }}>
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#814E1E" }}
                    >
                      Geschikt voor alle temperaturen
                    </h3>
                    <p className="text-gray-600">
                      Lost perfect op in koud, warm en heet water. Werkt zelfs
                      bij 20°C!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(214, 173, 97, 0.2)" }}
                  >
                    <span style={{ color: "#D6AD61", fontSize: "24px" }}>
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#814E1E" }}
                    >
                      Hypoallergeen & veilig
                    </h3>
                    <p className="text-gray-600">
                      Vrij van parabenen, fosfaten en optische witmakers. Veilig
                      voor baby's en gevoelige huid.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(214, 173, 97, 0.2)" }}
                  >
                    <span style={{ color: "#D6AD61", fontSize: "24px" }}>
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#814E1E" }}
                    >
                      Ruimtebesparend
                    </h3>
                    <p className="text-gray-600">
                      32 wasbeurten passen in een doosje ter grootte van je
                      handpalm. Ideaal voor kleine ruimtes!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <h3
                  className="text-2xl font-bold mb-6"
                  style={{ color: "#814E1E" }}
                >
                  Vergelijk zelf
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-medium">Aspect</span>
                    <div className="flex gap-8">
                      <span className="font-medium text-center">Wasstrips</span>
                      <span className="font-medium text-center">Vloeibaar</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Plasticvrij</span>
                    <div className="flex gap-12">
                      <span className="text-green-500">✓</span>
                      <span className="text-red-500">✗</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compact</span>
                    <div className="flex gap-12">
                      <span className="text-green-500">✓</span>
                      <span className="text-red-500">✗</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Voorgedoseerd</span>
                    <div className="flex gap-12">
                      <span className="text-green-500">✓</span>
                      <span className="text-red-500">✗</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reisklaar</span>
                    <div className="flex gap-12">
                      <span className="text-green-500">✓</span>
                      <span className="text-red-500">✗</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-bold text-center mb-12"
            style={{ color: "#814E1E" }}
          >
            Wat onze klanten zeggen
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F8F6F0] rounded-2xl p-6">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-[#D6AD61]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-4 italic" style={{ color: "#814E1E" }}>
                "Ik reis veel voor mijn werk en deze wasstrips zijn een
                uitkomst! Geen gedoe meer met lekke flessen in mijn koffer."
              </p>
              <p className="font-semibold" style={{ color: "#814E1E" }}>
                - Marieke H., Amsterdam
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-6">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-[#D6AD61]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-4 italic" style={{ color: "#814E1E" }}>
                "Eindelijk geen zwaar tillen meer! En ze werken net zo goed als
                mijn oude wasmiddel, maar dan veel milieuvriendelijker."
              </p>
              <p className="font-semibold" style={{ color: "#814E1E" }}>
                - Johan K., Utrecht
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-6">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-[#D6AD61]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-4 italic" style={{ color: "#814E1E" }}>
                "Mijn kinderen hebben een gevoelige huid en deze wasstrips zijn
                perfect! Geen irritatie meer en de was ruikt heerlijk fris."
              </p>
              <p className="font-semibold" style={{ color: "#814E1E" }}>
                - Sandra V., Den Haag
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-12 text-center text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #814E1E 0%, #D6AD61 100%)",
            }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Klaar voor de toekomst van wassen?
            </h2>
            <p className="text-2xl mb-8 opacity-90">
              Probeer onze wasstrips met 20% introductiekorting!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/wasparfum/wasgeurtje-wasstrips"
                className="bg-white px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
                style={{ color: "#814E1E" }}
              >
                BESTEL NU MET KORTING
              </Link>
              <p className="text-lg opacity-90">Code: STRIPS20</p>
            </div>
            <p className="text-lg mt-6 opacity-90">
              ✓ Gratis verzending ✓ 30 dagen proefperiode
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
