import { Metadata } from "next";
import { notFound } from "next/navigation";
import { WordPressService } from "services/wordpress-service";
import PageBuilder from "components/page-builder/PageBuilder";
import Footer from "components/sections/Footer";

// SEO Metadata (exacte match met WordPress Yoast)
export const metadata: Metadata = {
  title: "Ontdek Topkwaliteit Wasparfum | Wasgeurtje.nl - Gratis Bezorging",
  description:
    "✓ Gratis verzending bij Wasgeurtje.nl ✓ Langdurig geurende wasparfum voor elke wasbeurt. Vind jouw favoriet uit onze exclusieve collectie en geniet van onweerstaanbare frisheid!",
  keywords: [
    "wasparfum",
    "wasgeurtje",
    "wasgeur",
    "wasparfum kopen",
    "beste wasparfum",
    "luxe wasparfum",
  ],
  openGraph: {
    title: "Ontdek Topkwaliteit Wasparfum | Wasgeurtje.nl - Gratis Bezorging",
    description:
      "✓ Gratis verzending bij Wasgeurtje.nl ✓ Langdurig geurende wasparfum voor elke wasbeurt. Vind jouw favoriet uit onze exclusieve collectie en geniet van onweerstaanbare frisheid!",
    type: "website",
    url: "/wasparfum",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ontdek Topkwaliteit Wasparfum | Wasgeurtje.nl",
    description:
      "Langdurig geurende wasparfum voor elke wasbeurt. Gratis bezorging en exclusieve collectie.",
  },
  alternates: {
    canonical: "/wasparfum",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "/wasparfum",
  url: "/wasparfum",
  name: "Wasparfum - Luxe Wasparfums voor Heerlijk Geurende Was",
  description:
    "Ontdek onze exclusieve wasparfum collectie. Gratis verzending, langdurig geurend en geschikt voor alle soorten was.",
  inLanguage: "nl-NL",
  isPartOf: {
    "@type": "WebSite",
    "@id": "/",
    name: "Wasgeurtje.nl",
    url: "/",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Wasparfum",
        item: "/wasparfum",
      },
    ],
  },
};

export default async function WasparfumPage() {
  try {
    // Fetch WordPress data
    const { page, sectionsWithData } =
      await WordPressService.getWasparfumPageComplete();

    if (!page) {
      notFound();
    }

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <main className="wasparfum-page">
          {/* Page Builder Content */}
          {sectionsWithData && sectionsWithData.length > 0 && (
            <PageBuilder sections={sectionsWithData} />
          )}
        </main>

        {/* <Footer /> */}
      </>
    );
  } catch (error) {
    console.error("Error rendering wasparfum page:", error);
    notFound();
  }
}
