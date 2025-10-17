export interface Product {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: string;
  scents: string[];
  // Uitgebreide velden
  description?: string; // Korte productbeschrijving
  full_description?: string; // Volledige HTML-beschrijving met h1, h2, etc.
  images?: string[]; // Extra productafbeeldingen
  attributes?: ProductAttribute[]; // Productattributen/eigenschappen
  categories?: ProductCategory[]; // Productcategorieën
  tags?: ProductTag[]; // Producttags
  meta_data?: MetaData[]; // Metadata van product
  sku?: string; // Artikelnummer
  stock_status?: string; // Voorraadstatus
  on_sale?: boolean; // Of het product in de aanbieding is
  sale_price?: string; // Aanbiedingsprijs
  regular_price?: string; // Reguliere prijs
  price_suffix?: string; // Prijs suffix (bijv. "Slechts 0,40 cent per wasbeurt")
  in_stock?: boolean; // Of het product op voorraad is
  ingredients?: ProductIngredient[]; // Product ingrediënten (uit ACF)
  product_info?: ProductInfo[]; // Product info secties uit ACF
  icon_info?: IconInfo[]; // Icon info uit ACF
  experience_items?: ExperienceItem[]; // Checkboxitems uit ACF
  details?: ProductDetail[]; // Detail secties uit ACF (inclusief allergenen info)
  bottom_check?: BottomCheck[]; // Bottom check items uit ACF
  bottom_check_title?: string; // Titel voor bottom check items
  checkboxtitle?: string; // Titel voor experience items
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface MetaData {
  id: number;
  key: string;
  value: string;
}

// Extra typen voor het ProductTemplate
export interface ProductInfoSection {
  title: string;
  content: string;
}

export interface ProductIngredient {
  name: string;
  image:
    | string
    | {
        url?: string;
        sizes?: {
          thumbnail?: string;
          medium?: string;
          full?: string;
          [key: string]: string | undefined;
        };
        ID?: number;
        id?: number;
        title?: string;
        filename?: string;
        [key: string]: any;
      };
}

export interface ProductHighlight {
  text: string;
}

export interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: string;
  description: string;
  scents: string[];
  points?: number;
  sale?: boolean;
  originalPrice?: string;
}

export interface ProductInfo {
  title: string;
  info: string;
}

export interface IconInfo {
  icon: {
    url: string;
    ID?: number;
    id?: number;
    title?: string;
    alt?: string;
    [key: string]: any;
  };
  text_1: string;
  text_2: string;
}

export interface ExperienceItem {
  item: string;
}

export interface ProductDetail {
  title: string;
  content: string;
}

export interface BottomCheck {
  item: string;
}
