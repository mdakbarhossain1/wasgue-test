// ACF Types voor WordPress Page Builder
export interface PageBuilderSection {
  acf_fc_layout: string;
}

export interface ProductSection extends PageBuilderSection {
  acf_fc_layout: 'product';
  section_title: string;
  products: Product[];
}

export interface FancyProductSection extends PageBuilderSection {
  acf_fc_layout: 'fancy_product';
  background?: {
    url: string;
    alt: string;
  };
  section_title: string;
  sub_title: string;
  products: Product[];
  product_note: string;
}

export interface InfoboxSection extends PageBuilderSection {
  acf_fc_layout: 'infobox';
  section_title: string;
  details: string;
  info_type: 'box' | 'number';
  box: InfoboxItem[];
}

export interface InfoboxItem {
  title: string;
  details: string;
}

export interface ImageTextBlockSection extends PageBuilderSection {
  acf_fc_layout: 'image_text_block';
  image: {
    url: string;
    alt: string;
  };
  title: string;
  content: string; // HTML content
  list_type: 'number' | 'timeline' | 'checked';
  list: ListItem[];
  extra_content: string; // HTML content
}

export interface ListItem {
  text: string;
}

export interface FAQSection extends PageBuilderSection {
  acf_fc_layout: 'faq';
  section_title?: string;
  faq: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: {
    id: number;
    src: string;
    alt: string;
  }[];
  short_description: string;
  description: string;
}

// Main page builder type
export type PageBuilderSections = (
  | ProductSection
  | FancyProductSection
  | InfoboxSection
  | ImageTextBlockSection
  | FAQSection
)[];

// Page data structure
export interface WasparfumPage {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  acf: {
    page_builder: PageBuilderSections;
  };
  yoast_head?: string;
  featured_media?: number;
}
