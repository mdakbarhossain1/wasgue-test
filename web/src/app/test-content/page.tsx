"use client";

import { useState, useEffect } from "react";
import { ComponentRenderer } from "components/wordpress/ComponentRegistry";
import Footer from "components/sections/Footer";

export default function TestContentPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test data based on your ACF structure
    const testData = {
      id: 1,
      title: { rendered: "Test Page" },
      acf: {
        flexible_content: [
          {
            acf_fc_layout: "text_content",
            title: "Laat een bericht achter",
            content: `<p>Heeft u een vraag over uw bestelling, of is er iets anders waarbij we u kunnen helpen? Aarzel niet om contact met ons op te nemen, stuur ons een bericht naar <a href="mailto:info@wasgeurtje.nl">info@wasgeurtje.nl</a></p>
<p>We streven ernaar om alle vragen binnen 2 werkdagen te beantwoorden en kijken ernaar uit om u van dienst te zijn. Uw tevredenheid is onze prioriteit!</p>`,
            style: {
              background_color: "#F8F6F0",
              text_color: "#333333",
              alignment: "center",
            },
          },
        ],
      },
    };

    // Simulate API call
    setTimeout(() => {
      try {
        // Import transform function
        import("utils/wordpress-api").then(({ transformFlexibleContent }) => {
          const transformedComponents = transformFlexibleContent(
            testData.acf.flexible_content
          );
          setComponents(transformedComponents);
          setPageData(testData);
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }, 100);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6AD61] mx-auto"></div>
          <p className="mt-4 text-[#814E1E]">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F0]">
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
          <div className="bg-gray-100 p-4 rounded mb-8">
            <h2 className="font-bold mb-2">Page Data:</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(pageData, null, 2)}
            </pre>
          </div>
          <div className="bg-gray-100 p-4 rounded mb-8">
            <h2 className="font-bold mb-2">Transformed Components:</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(components, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      <div className="border-t-4 border-[#D6AD61] my-8"></div>

      {/* Render the actual components */}
      <ComponentRenderer components={components} />

      {/* <Footer /> */}
    </main>
  );
}
