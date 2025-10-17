// Page Builder Components Export
export { default as PageBuilder } from "./PageBuilder";
export { default as ProductSection } from "./ProductSection";
export { default as FancyProductSection } from "./FancyProductSection";
export { default as InfoboxSection } from "./InfoboxSection";
export { default as ImageTextBlockSection } from "./ImageTextBlockSection";
export { default as FAQSection } from "./FAQSection";

// Re-export types for convenience
export type {
  PageBuilderSections,
  ProductSection as ProductSectionType,
  FancyProductSection as FancyProductSectionType,
  InfoboxSection as InfoboxSectionType,
  ImageTextBlockSection as ImageTextBlockSectionType,
  FAQSection as FAQSectionType,
  Product,
  WasparfumPage,
} from "types/acf";
