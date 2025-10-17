"use client";

import React from "react";
import { ACFPageBuilderSections } from "types/wordpress-acf";
import ProductSection from "./ProductSection";
import FancyProductSection from "./FancyProductSection";
import InfoboxSection from "./InfoboxSection";
import ImageTextBlockSection from "./ImageTextBlockSection";
import FAQSection from "./FAQSection";

interface PageBuilderProps {
  sections: ACFPageBuilderSections[];
}

export default function PageBuilder({ sections }: PageBuilderProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Geen content secties gevonden.</p>
      </div>
    );
  }

  return (
    <div className="page-builder">
      {sections.map((section, index) => {
        const key = `section-${section.acf_fc_layout}-${index}`;

        switch (section.acf_fc_layout) {
          case "product":
            return <ProductSection key={key} section={section} />;

          case "fancy_product":
            return <FancyProductSection key={key} section={section} />;

          case "infobox":
            return <InfoboxSection key={key} section={section} />;

          case "image_text_block":
            return <ImageTextBlockSection key={key} section={section} />;

          case "faq":
            return <FAQSection key={key} section={section} />;

          default:
            console.warn(
              `Unknown ACF layout: ${(section as any).acf_fc_layout}`
            );
            return null;
        }
      })}
    </div>
  );
}
