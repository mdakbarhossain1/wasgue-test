import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductTemplate from "components/ProductTemplate";
import { getProductById } from "utils/product-helpers";

// Generate static metadata for the page
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Full Moon - Premium Wasparfum | Wasgeurtje",
    description:
      "Ontdek Full Moon, de #1 wasgeurtje voor Nederlandse vrouwen. 40+ wasbeurten, natuurlijke ingrediënten, langdurige geur. Nu 25% korting!",
    keywords:
      "wasparfum, wasgeurtje, Full Moon, natuurlijk, Nederland, vrouwen, luxe, aromatherapie",
    openGraph: {
      title: "Full Moon - Premium Wasparfum | Wasgeurtje",
      description:
        "De #1 wasgeurtje voor Nederlandse vrouwen. 40+ wasbeurten, natuurlijke ingrediënten, langdurige geur.",
      images: [{ url: "/wp-content/uploads/2023/full-moon-product.jpg" }],
    },
  };
}

export default async function FullMoonCROPage() {
  // Fetch Full Moon product data (ID: 1425)
  const product = await getProductById("1425");

  // If product not found
  if (!product) {
    notFound();
  }

  // CRO-optimized product data
  const croProductData = {
    ...product,
    price: "14.95", // Clean price format for CRO
  };

  // Define product info sections optimized for female audience
  const productInfoSections = [
    {
      title: "💜 Geurprofiel",
      content:
        "Romantische bloemengeur met hints van vanille en musk - perfect voor de moderne vrouw",
    },
    {
      title: "⏰ Gebruiksduur",
      content: "40+ wasbeurten per flesje - slechts €0,37 per wasbeurt",
    },
    {
      title: "🌿 Ingrediënten",
      content:
        "100% natuurlijk, hypoallergeen, veilig voor baby's en gevoelige huid",
    },
    {
      title: "📦 Inhoud",
      content: "100ml premium wasparfum in luxe glazen flesje",
    },
  ];

  // Define ingredients with wellness focus
  const ingredients = [
    {
      name: "Citroen",
      image: "/figma/productpagina/Citroen.png",
    },
    {
      name: "Geranium",
      image: "/figma/productpagina/geranium.png",
    },
    {
      name: "Japanse roos",
      image: "/figma/productpagina/japanse-roos.png",
    },
    {
      name: "Korenbloem",
      image: "/figma/productpagina/korenbloem.png",
    },
  ];

  // Define highlights optimized for female psychology
  const highlights = [
    { text: "Luxueuze spa-geur die 6 weken aanhoudt in je kast" },
    { text: "Natuurlijke aromatherapie voor dagelijkse wellness" },
    { text: "40+ wasbeurten - veel voordeliger dan dure parfums" },
    { text: "Hypoallergeen en baby-vriendelijk" },
    { text: "Gemaakt in Nederland met liefde voor kwaliteit" },
    { text: "Complimenten gegarandeerd van familie en vrienden" },
  ];

  // Mock testimonials (in real implementation, fetch from database)
  const testimonials = [
    {
      name: "Sarah M.",
      location: "Amsterdam",
      text: "Eindelijk een wasparfum die echt lang ruikt! Mijn kleding ruikt nog steeds heerlijk na een week in de kast.",
      rating: 5,
    },
    {
      name: "Linda K.",
      location: "Antwerpen",
      text: "Mijn man vroeg wat voor nieuwe parfum ik droeg... het was gewoon mijn verse was! Fantastisch product.",
      rating: 5,
    },
    {
      name: "Emma V.",
      location: "Rotterdam",
      text: "Als werkende moeder wil ik dat alles perfect ruikt. Full Moon geeft me dat luxe gevoel elke dag.",
      rating: 5,
    },
  ];

  return (
    <ProductTemplate
      product={croProductData}
      productInfoSections={productInfoSections}
      ingredients={ingredients}
      highlights={highlights}
      testimonials={testimonials}
    />
  );
}
