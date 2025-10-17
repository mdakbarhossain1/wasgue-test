import { notFound } from "next/navigation";
import { Metadata } from "next";
import Footer from "components/sections/Footer";
import ProductTemplate, { ProductIngredient } from "components/ProductTemplate";
import { getProductBySlug } from "utils/woocommerce";
import {
  getMetaData,
  getProductInfoSections,
  getProductIngredients,
  getProductHighlights,
  getRelatedProducts,
} from "utils/product-helpers";
import ProductDetailsCustom from "components/ProductDetailsCustom";

// Default "How It Works" section for all products
const defaultHowItWorks = {
  title: "Waarom de geurbeleving",
  steps: [
    {
      image: "/figma/productpagina/image 7.png",
      title: "Voor elk moment",
      description: "Het perfecte wasparfum voor elke stemming en seizoen",
    },
    {
      image: "/figma/productpagina/image 8.png",
      title: "Langdurige geur",
      description:
        "Geniet wekenlang van een heerlijke geur in je kast en kleding",
    },
    {
      image: "/figma/productpagina/image 9.png",
      title: "Eenvoudig doseren",
      description: "Voeg enkele druppels toe aan je wasverzachter vakje",
    },
  ],
};

// Default promises for all products
const defaultPromises = {
  title: "Wij beloven je",
  items: [
    "Gratis verzending in NL & BE 📦",
    "Uitzonderlijke kwaliteit wasgeur",
    "Op werkdagen voor 16.00 besteld, vandaag verzonden 🚀",
    "Gemaakt van milieuvriendelijke en duurzame materialen",
  ],
};

// Define proper types for Next.js page props
type PageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

// Generate static metadata for the page
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  console.log("params: i m here ", params.slug);
  const product = await getProductBySlug(params.slug);
  console.log("product: tesetesss", product);

  if (!product) {
    return {
      title: "Product niet gevonden | Wasgeurtje",
      description: "Het product dat je zoekt kon niet worden gevonden.",
    };
  }

  // Get SEO metadata from Yoast if available
  const yoastMetaDesc = product.meta_data
    ? getMetaData(product.meta_data, "_yoast_wpseo_metadesc")
    : null;
  const yoastFocusKw = product.meta_data
    ? getMetaData(product.meta_data, "_yoast_wpseo_focuskw")
    : null;
  const yoastTitle = product.meta_data
    ? getMetaData(product.meta_data, "_yoast_wpseo_title")
    : null;

  return {
    title: yoastTitle || `${product.title} | Wasgeurtje`,
    description:
      yoastMetaDesc ||
      (product.description
        ? product.description.replace(/<\/?[^>]+(>|$)/g, "")
        : `Ontdek ${product.title} met geuren van ${product?.scents.join(
            ", "
          )}. Koop nu bij Wasgeurtje.`),
    keywords: yoastFocusKw || product.title,
    openGraph: {
      title: yoastTitle || product.title,
      description:
        yoastMetaDesc || product.description?.replace(/<\/?[^>]+(>|$)/g, ""),
      images:
        product.images && product.images.length > 0
          ? [{ url: product.images[0] }]
          : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  // Fetch product data by slug
  const product = await getProductBySlug(params.slug);

  // If product not found
  if (!product) {
    notFound();
  }

  // Get additional product data
  // 1. Product Info Sections (ingredients, usage, etc.)
  const productInfoSections = getProductInfoSections(product);

  // 2. Product ingredients - use ACF data from woocommerce.ts getProductBySlug
  const ingredients = (product.ingredients || []).map((ingredient) => ({
    name: ingredient.name,
    image:
      typeof ingredient.image === "string"
        ? ingredient.image
        : ingredient.image?.url || "",
  }));

  // Log for debugging if no ingredients found
  if (ingredients.length === 0) {
    console.log(
      `No ingredients found for product "${product.title}" (slug: ${product.slug}). Please check ACF configuration in WordPress.`
    );
  }

  // 3. Product highlights (USPs)
  const highlights = getProductHighlights(product);

  // 4. Related products
  const relatedProducts = await getRelatedProducts(product);

  // Get custom USP title if available
  const uspsTitle = product.meta_data
    ? getMetaData(product.meta_data, "usps_title") ||
      `Waarom ${product.title} zo speciaal is`
    : `Waarom ${product.title} zo speciaal is`;

  // If we don't have product highlights from metadata, create some generic ones
  const finalHighlights =
    highlights.length > 0
      ? highlights
      : [
          { text: "Gaat tot 40+ wasbeurten mee" },
          { text: "Premium geurbeleving" },
          { text: "Langdurige geur" },
        ];

  // Use custom product info sections if available, or create from attributes
  const finalProductInfoSections =
    productInfoSections.length > 0
      ? productInfoSections
      : product.attributes
          ?.filter((attr) => attr.visible)
          .map((attr) => ({
            title: attr.name,
            content: attr.options.join(", "),
          })) || [];

  // Add "Inhoud: 100ml" if not present
  if (
    !finalProductInfoSections.find(
      (section) => section.title.toLowerCase() === "inhoud"
    )
  ) {
    finalProductInfoSections.push({
      title: "Inhoud",
      content: "100ml",
    });
  }

  // Debug log to check what product data is being passed

  if (params.slug === "proefpakket") {
    return (
      <ProductDetailsCustom
        product={product}
        relatedProducts={relatedProducts}
      />
    );
  }

  return (
    <ProductTemplate
      product={product}
      productInfoSections={finalProductInfoSections}
      ingredients={ingredients}
      highlights={finalHighlights}
      relatedProducts={relatedProducts}
      howItWorks={defaultHowItWorks}
      uspsTitle={uspsTitle}
      promises={defaultPromises}
    />
  );
}
