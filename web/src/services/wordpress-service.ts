import {
  getWasparfumPageData,
  transformWordPressProduct,
} from "lib/wordpress-api";
import {
  WordPressPageWithACF,
  ACFPageBuilderSections,
  WordPressImage,
} from "types/wordpress-acf";

// Service voor het ophalen en transformeren van WordPress data
export class WordPressService {
  // Fetch wasparfum page met alle gerelateerde data
  static async getWasparfumPageComplete(): Promise<{
    page: WordPressPageWithACF | null;
    sectionsWithData: any[];
  }> {
    try {
      // 1. Haal page data op
      const pageData = await getWasparfumPageData();

      if (!pageData || !pageData.acf?.page_builder) {
        console.log("No page data found, using fallback");
        return this.getFallbackData();
      }

      console.log("WordPress page data loaded:", {
        sections: pageData.acf.page_builder.length,
        title: pageData.title?.rendered,
      });

      // 2. Transform page builder secties met echte data
      const sectionsWithData = await Promise.all(
        pageData.acf.page_builder.map((section: any, index: number) => {
          return this.transformSectionWithData(section, index);
        })
      );

      return {
        page: pageData,
        sectionsWithData: sectionsWithData.filter(Boolean),
      };
    } catch (error) {
      console.error("WordPress Service Error:", error);
      return this.getFallbackData();
    }
  }

  // Transform section met echte product/media data
  static async transformSectionWithData(
    section: any,
    index: number
  ): Promise<any> {
    try {
      console.log(`Transforming section ${index + 1}:`, section.acf_fc_layout);

      switch (section.acf_fc_layout) {
        case "product":
        case "fancy_product":
          // Transform product data
          const products = await Promise.all(
            (section.products || []).map((product: any) =>
              transformWordPressProduct(product)
            )
          );

          const transformedSection = {
            ...section,
            products,
          };

          // Voor fancy_product ook background image transformeren
          if (section.acf_fc_layout === "fancy_product" && section.background) {
            transformedSection.background = this.transformImageData(
              section.background
            );
          }

          return transformedSection;

        case "image_text_block":
          // Transform image data
          const transformedImage = this.transformImageData(section.image);
          return {
            ...section,
            image: transformedImage,
          };

        case "infobox":
        case "faq":
          // Deze secties zijn al correct geformatteerd
          return section;

        default:
          console.warn(`Unknown ACF layout: ${section.acf_fc_layout}`);
          return section;
      }
    } catch (error) {
      console.error(
        `Error transforming section ${section.acf_fc_layout}:`,
        error
      );
      return section; // Return original section as fallback
    }
  }

  // Transform WordPress image data
  static transformImageData(imageField: any): WordPressImage | null {
    try {
      // Als het al een volledig object is (uit API)
      if (typeof imageField === "object" && imageField.url) {
        return {
          id: imageField.ID || imageField.id,
          url: imageField.url,
          alt: imageField.alt || "",
          caption: imageField.caption || "",
          sizes: imageField.sizes || {},
        };
      }

      // Als het een string URL is
      if (typeof imageField === "string") {
        return {
          id: 0,
          url: imageField,
          alt: "",
          caption: "",
          sizes: {},
        };
      }

      return null;
    } catch (error) {
      console.error("Error transforming image data:", error);
      return null;
    }
  }

  // Get fallback data als WordPress API faalt
  static getFallbackData() {
    console.log("Using fallback data");
    return {
      page: {
        id: 24,
        title: { rendered: "Wasparfum" },
        content: { rendered: "" },
        slug: "wasparfum",
        link: "https://wasgeurtje.nl/wasparfum/",
        acf: { page_builder: [] },
      } as WordPressPageWithACF,
      sectionsWithData: [],
    };
  }
}
