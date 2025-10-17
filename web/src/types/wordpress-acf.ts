// Exacte ACF Types gebaseerd op WordPress wasparfum pagina analyse

// Base WordPress Image Type
export interface WordPressImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
  sizes?: {
    thumbnail?: string;
    medium?: string;
    large?: string;
    full?: string;
  };
}

// Base WordPress Product Type (WooCommerce)
export interface WordPressProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  featured: boolean;
  stock_status: string;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  short_description: string;
  description: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

// Page Builder Section Base Type
export interface ACFPageBuilderSection {
  acf_fc_layout: string;
}

// 1. Product Section (Layout: 'product')
export interface ACFProductSection extends ACFPageBuilderSection {
  acf_fc_layout: 'product';
  section_title: string;
  products: number[]; // Array van product IDs
}

// 2. Fancy Product Section (Layout: 'fancy_product') 
export interface ACFFancyProductSection extends ACFPageBuilderSection {
  acf_fc_layout: 'fancy_product';
  background: WordPressImage;
  section_title: string;
  sub_title: string;
  products: number[]; // Array van product IDs
  product_note: string;
}

// 3. Infobox Section (Layout: 'infobox')
export interface ACFInfoboxItem {
  title: string;
  details: string;
}

export interface ACFInfoboxSection extends ACFPageBuilderSection {
  acf_fc_layout: 'infobox';
  section_title: string;
  details: string;
  info_type: 'box' | 'number';
  box: ACFInfoboxItem[];
}

// 4. Image Text Block Section (Layout: 'image_text_block')
export interface ACFListItem {
  text: string;
}

export interface ACFImageTextBlockSection extends ACFPageBuilderSection {
  acf_fc_layout: 'image_text_block';
  image: WordPressImage;
  title: string;
  content: string; // HTML content
  list_type: 'number' | 'timeline' | 'checked';
  list: ACFListItem[];
  extra_content: string; // HTML content
}

// 5. FAQ Section (Layout: 'faq')
export interface ACFFAQItem {
  question: string;
  answer: string;
}

export interface ACFFAQSection extends ACFPageBuilderSection {
  acf_fc_layout: 'faq';
  section_title?: string; // Optional - kan leeg zijn
  faq: ACFFAQItem[];
}

// Union type voor alle Page Builder secties
export type ACFPageBuilderSections = 
  | ACFProductSection 
  | ACFFancyProductSection 
  | ACFInfoboxSection 
  | ACFImageTextBlockSection 
  | ACFFAQSection;

// WordPress Page Type met ACF data
export interface WordPressPageWithACF {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  link: string;
  acf: {
    page_builder: ACFPageBuilderSections[];
  };
  yoast_head?: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    og_title?: string;
    og_description?: string;
    og_image?: Array<{
      url: string;
    }>;
  };
}
