export async function fetchWpBySlug(
  type: 'pages' | 'posts',
  slug: string
) {
  const base = process.env.WORDPRESS_API_URL
  const url = `${base}/${type}?slug=${encodeURIComponent(slug)}&_embed=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('WP fetch failed');
  const items = await res.json();
  return items?.[0] || null;
}

export function yoastToNextMetadata(yoast?: any): import('next').Metadata {
  if (!yoast) return {};
  const og = yoast.og_image?.[0];
  const twitterImg = yoast.twitter_image;

  return {
    title: yoast.title || yoast.og_title || yoast.twitter_title,
    description: yoast.description || yoast.og_description || yoast.twitter_description,
    alternates: yoast.canonical ? { canonical: yoast.canonical } : undefined,
    robots: yoast.robots
      ? {
          index: yoast.robots.index !== 'noindex',
          follow: yoast.robots.follow !== 'nofollow',
        }
      : undefined,
    openGraph: {
      title: yoast.og_title || yoast.title,
      description: yoast.og_description || yoast.description,
      url: yoast.og_url || yoast.canonical,
      type: yoast.og_type || 'website',
      images: og
        ? [{ url: og.url, width: og.width, height: og.height, alt: yoast.og_title }]
        : undefined,
      siteName: yoast.og_site_name,
    },
    twitter: {
      card: yoast.twitter_card || 'summary_large_image',
      title: yoast.twitter_title || yoast.title,
      description: yoast.twitter_description || yoast.description,
      images: twitterImg ? [twitterImg] : undefined,
    },
  };
}

export async function fetchWpTermBySlug(
  taxonomy: 'product_cat' | 'product_tag',
  slug: string
) {
  const base = process.env.WORDPRESS_API_URL;
  const url = `${base}/${taxonomy}?slug=${encodeURIComponent(slug)}&_fields=id,name,slug,description,yoast_head_json`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('WP term fetch failed');
  const items = await res.json();
  return Array.isArray(items) ? items[0] || null : items;
}