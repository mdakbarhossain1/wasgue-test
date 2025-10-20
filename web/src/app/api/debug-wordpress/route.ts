import { NextResponse } from "next/server";

const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL || "https://wasgeurtje.nl/wp-json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "wasparfum";

  try {
    // 1. Get page data
    const pageResponse = await fetch(
      `${WORDPRESS_API_URL}/wp/v2/pages?slug=${slug}&acf_format=standard`
    );
    const pageData = await pageResponse.json();

    if (!pageData[0]) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const page = pageData[0];
    // 2. Get all product IDs from ACF data
    const productIds = new Set<number>();
    if (page.acf?.page_builder) {
      page.acf.page_builder.forEach((section: any) => {
        if (section.products) {
          section.products.forEach((product: any) => {
            if (product.ID) productIds.add(product.ID);
          });
        }
      });
    }

    // 3. Try to fetch each product individually
    const productDetails: any[] = [];
    for (const id of productIds) {
      try {
        // Try wp/v2/product endpoint
        const wpResponse = await fetch(
          `${WORDPRESS_API_URL}/wp/v2/product/${id}?_embed=true`
        );
        if (wpResponse.ok) {
          const data = await wpResponse.json();
          productDetails.push({ source: "wp/v2/product", id, data });
        }

        // Try wc/v3/products endpoint (without auth for now)
        const wcResponse = await fetch(
          `${WORDPRESS_API_URL}/wc/v3/products/${id}`
        );
        if (wcResponse.ok) {
          const data = await wcResponse.json();
          productDetails.push({ source: "wc/v3/products", id, data });
        }
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
      }
    }

    // 4. Get featured media for products
    const mediaIds = new Set<number>();
    page.acf?.page_builder.forEach((section: any) => {
      if (section.products) {
        section.products.forEach((product: any) => {
          if (product.featured_media) mediaIds.add(product.featured_media);
        });
      }
    });

    const mediaDetails: any[] = [];
    for (const id of mediaIds) {
      try {
        const response = await fetch(`${WORDPRESS_API_URL}/wp/v2/media/${id}`);
        if (response.ok) {
          const data = await response.json();
          mediaDetails.push({ id, url: data.source_url, alt: data.alt_text });
        }
      } catch (error) {
        console.error(`Error fetching media ${id}:`, error);
      }
    }

    return NextResponse.json({
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title?.rendered,
        sectionsCount: page.acf?.page_builder?.length || 0,
      },
      productIds: Array.from(productIds),
      productDetails,
      mediaIds: Array.from(mediaIds),
      mediaDetails,
      rawPageData: page,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "API Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
