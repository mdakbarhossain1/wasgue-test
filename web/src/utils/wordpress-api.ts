// WordPress API utilities for fetching pages, posts, and ACF content

const WP_API_URL =
  process.env.WORDPRESS_API_URL || "https://wasgeurtje.nl/wp-json/wp/v2";
const WC_API_URL =
  process.env.WOOCOMMERCE_API_URL || "https://wasgeurtje.nl/wp-json/wc/v3";
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

export function getWPHeaders() {
  const token = Buffer.from(`${CK}:${CS}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "Content-Type": "application/json",
  };
}

// Fetch a single page by slug or ID
export async function fetchPage(slugOrId: string | number) {
  const isId = typeof slugOrId === "number" || /^\d+$/.test(slugOrId);
  const endpoint = isId
    ? `${WP_API_URL}/pages/${slugOrId}?acf_format=standard&_embed`
    : `${WP_API_URL}/pages?slug=${slugOrId}&acf_format=standard&_embed`;

  const response = await fetch(endpoint, {
    headers: getWPHeaders(),
    next: { revalidate: 3600 }, // 1 hour cache
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const data = await response.json();

  // If fetched by slug, data is an array
  if (!isId && Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error("Page not found");
    }
    return data[0];
  }

  return data;
}

// Fetch all pages
export async function fetchAllPages() {
  const response = await fetch(
    `${WP_API_URL}/pages?per_page=100&acf_format=standard`,
    {
      headers: getWPHeaders(),
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.status}`);
  }

  return response.json();
}

// Fetch posts with pagination
export async function fetchPosts(page = 1, perPage = 10, category?: string) {
  let endpoint = `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&_embed`;

  if (category) {
    // First get category ID from slug
    const catResponse = await fetch(
      `${WP_API_URL}/categories?slug=${category}`,
      {
        headers: getWPHeaders(),
      }
    );

    if (catResponse.ok) {
      const categories = await catResponse.json();
      if (categories.length > 0) {
        endpoint += `&categories=${categories[0].id}`;
      }
    }
  }

  const response = await fetch(endpoint, {
    headers: getWPHeaders(),
    next: { revalidate: 300 }, // 5 minutes cache for blog posts
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  return {
    posts: await response.json(),
    totalPages: response.headers.get("X-WP-TotalPages"),
    total: response.headers.get("X-WP-Total"),
  };
}

// Transform ACF Flexible Content to component props
export function transformFlexibleContent(flexibleContent: any[]): any[] {
  if (!Array.isArray(flexibleContent)) return [];

  return flexibleContent
    .map((section) => {
      const layout = section.acf_fc_layout;

      switch (layout) {
        case "text_content":
          return {
            component: "TextContent",
            props: {
              title: section.title,
              content: section.content,
              backgroundColor: section.background_color || "#FFFFFF",
              textColor: section.text_color || "#333333",
              backgroundImage: section.background?.url,
              minHeight: section.min_height,
              overlay: section.ovelay, // Note: typo in ACF field name
            },
          };

        case "hero_section":
          return {
            component: "HeroSection",
            props: {
              title: section.title,
              subtitle: section.subtitle,
              backgroundImage: section.background_image?.url,
              ctaText: section.cta_text,
              ctaLink: section.cta_link,
              alignment: section.alignment || "center",
            },
          };

        case "product_grid":
          return {
            component: "ProductGrid",
            props: {
              title: section.title,
              products: section.products || [],
              columns: section.columns || 4,
              showPrices: section.show_prices !== false,
            },
          };

        case "text_image":
          return {
            component: "TextImageSection",
            props: {
              title: section.title,
              content: section.content,
              image: section.image?.url,
              imagePosition: section.image_position || "right",
              backgroundColor: section.background_color,
            },
          };

        case "testimonials":
          return {
            component: "TestimonialsSection",
            props: {
              title: section.title,
              testimonials: section.testimonials || [],
              layout: section.layout || "carousel",
            },
          };

        case "faq":
        case "FAQ":
          return {
            component: "FAQ",
            props: {
              sectionTitle: section.section_title,
              items:
                section.faq?.map((item: any) => ({
                  question: item.question,
                  answer: item.answer,
                })) || [],
            },
          };

        case "image_text_block":
        case "image-text-block":
        case "Image Text Block":
          return {
            component: "ImageTextBlock",
            props: {
              title: section.title,
              content: section.content,
              image: section.image,
              list: section.list,
              extraContent: section.extra_content,
              imagePosition: section.image_position || "left",
              backgroundColor: section.background_color,
              textColor: section.text_color,
            },
          };

        case "product_show_case":
          return {
            component: "ProductShowcase",
            props: {
              title: section.title,
              products: section.products || [],
              displayType: section.display_type || "grid",
              columns: section.columns || 4,
            },
          };

        case "text_box":
          return {
            component: "TextBox",
            props: {
              title: section.title,
              content: section.content,
              backgroundColor: section.background_color,
              textColor: section.text_color,
              alignment: section.alignment || "center",
              boxes: section.boxes || [],
            },
          };

        case "product":
        case "Product":
          // Check if this is the multi-product showcase variant
          if (section.products && Array.isArray(section.products)) {
            return {
              component: "ProductShowcase",
              props: {
                sectionTitle: section.section_title,
                products: section.products,
              },
            };
          }
          // Otherwise it's a single product display
          return {
            component: "ProductSingle",
            props: {
              product: section.product,
              showDescription: section.show_description,
              showPrice: section.show_price,
            },
          };

        case "video":
        case "Video":
          return {
            component: "Video",
            props: {
              videoThumbnail: section.video_thumbnail?.url,
              videoUrl: section.video_url,
              videoEmbed: section.video_embed,
              title: section.title,
            },
          };

        case "timeline":
          return {
            component: "Timeline",
            props: {
              title: section.title,
              items:
                section.timeline?.map((item: any) => ({
                  title: item.title,
                  description: item.content,
                  icon: item.logo?.url,
                })) || [],
              footer: section.timeline_footer,
            },
          };

        case "contact":
          return {
            component: "ContactSection",
            props: {
              image: section.map?.url,
              googleMap: section.google_map,
              contactFormShortcode: section.contact_from_shortcode,
            },
          };

        case "fancy_product":
          return {
            component: "FancyProduct",
            props: {
              title: section.title,
              product: section.product,
              backgroundColor: section.background_color,
              textColor: section.text_color,
              accentColor: section.accent_color,
              showPrice: section.show_price,
              showDescription: section.show_description,
              buttonText: section.button_text,
              layout: section.layout || "centered",
              showFeatures: section.show_features,
            },
          };

        case "infobox":
          return {
            component: "Infobox",
            props: {
              title: section.title,
              content: section.content,
              icon: section.icon?.url,
              style: section.style || "default",
            },
          };

        case "cta_banner":
          return {
            component: "CTABanner",
            props: {
              title: section.title,
              description: section.description,
              buttonText: section.button_text,
              buttonLink: section.button_link,
              backgroundType: section.background_type,
              backgroundColor: section.background_color,
              backgroundImage: section.background_image?.url,
            },
          };

        case "content_columns":
          return {
            component: "ContentColumns",
            props: {
              columns: section.columns || [],
              columnCount: section.column_count || 3,
              gap: section.gap || "medium",
            },
          };

        default:
          console.warn(`Unknown ACF layout: ${layout}`);
          return null;
      }
    })
    .filter(Boolean);
}

// Fetch menu by location
export async function fetchMenu(location: string) {
  try {
    // This requires a menu plugin with REST API support
    const response = await fetch(
      `${WP_API_URL}/menus/v1/locations/${location}`,
      {
        headers: getWPHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching menu:", error);
    return null;
  }
}

// Fetch global options (ACF Options Page)
export async function fetchGlobalOptions() {
  try {
    const response = await fetch(`${WP_API_URL}/options/acf`, {
      headers: getWPHeaders(),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {};
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching global options:", error);
    return {};
  }
}

// Enhanced helper to extract complete SEO data from Yoast
export function extractSEOData(page: any) {
  const yoast = page.yoast_head_json || page.yoast_meta || {};
  const fallbackTitle = page.title?.rendered
    ? page.title.rendered.replace(/<[^>]*>/g, "")
    : "";
  const fallbackDescription = page.excerpt?.rendered
    ? page.excerpt.rendered.replace(/<[^>]*>/g, "").substring(0, 160)
    : "";

  return {
    title: yoast.title || fallbackTitle,
    description:
      yoast.description || yoast.og_description || fallbackDescription,
    canonical: yoast.canonical || "",
    ogTitle: yoast.og_title || yoast.title || fallbackTitle,
    ogDescription:
      yoast.og_description || yoast.description || fallbackDescription,
    ogImage: yoast.og_image?.[0]?.url || "",
    ogLocale: yoast.og_locale || "nl_NL",
    ogType: yoast.og_type || "website",
    ogUrl: yoast.og_url || "",
    ogSiteName: yoast.og_site_name || "Wasgeurtje",
    twitterCard: yoast.twitter_card || "summary_large_image",
    twitterSite: yoast.twitter_site || "@wasgeurtje",
    twitterCreator: yoast.twitter_creator || "@wasgeurtje",
    twitterTitle:
      yoast.twitter_title || yoast.og_title || yoast.title || fallbackTitle,
    twitterDescription:
      yoast.twitter_description ||
      yoast.og_description ||
      yoast.description ||
      fallbackDescription,
    twitterImage: yoast.twitter_image || yoast.og_image?.[0]?.url || "",
    robots: {
      index: yoast.robots?.index !== "noindex",
      follow: yoast.robots?.follow !== "nofollow",
      googleBot:
        yoast.robots?.googlebot ||
        "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1",
    },
    schema: yoast.schema || {},
    breadcrumbs: yoast.breadcrumbs || [],
    keywords: yoast.keywords || "",
    author: yoast.author || "",
    datePublished: page.date || "",
    dateModified: page.modified || page.date || "",
    inLanguage: yoast.og_locale || "nl-NL",
  };
}
