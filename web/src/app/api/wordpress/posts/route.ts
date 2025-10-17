import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://wasgeurtje.nl/wp-json/wp/v2';

// Headers for WordPress API
function wpHeaders() {
  return {
    'Authorization': `Bearer ${process.env.WORDPRESS_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '12';

    let url = `${WORDPRESS_API_URL}/posts?_embed=true&per_page=${per_page}&page=${page}&status=publish&_fields=id,title,content,excerpt,slug,date,modified,status,featured_media,categories,tags,acf,yoast_head,yoast_head_json,link,_embedded`;
    
    if (slug) {
      url += `&slug=${slug}`;
    }

    const response = await fetch(url, {
      headers: wpHeaders(),
      next: { revalidate: 300 } // 5 minutes cache
    });

    if (!response.ok) {
      console.error('WordPress API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch posts from WordPress' },
        { status: response.status }
      );
    }

    const posts = await response.json();

    // Transform posts to include featured image URL
    const transformedPosts = Array.isArray(posts) ? posts.map(transformPost) : [transformPost(posts)];

    // If searching for a specific slug, return the first post or null
    if (slug) {
      return NextResponse.json(transformedPosts[0] || null);
    }

    return NextResponse.json(transformedPosts);

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function transformPost(post: any) {
  // Extract featured image URL from _embedded data or og_image
  let featured_image_url = null;
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featured_image_url = post._embedded['wp:featuredmedia'][0].source_url;
  } else if (post.yoast_head_json?.og_image?.[0]?.url) {
    featured_image_url = post.yoast_head_json.og_image[0].url;
  }

  // Extract author name from _embedded data or yoast
  let author_name = null;
  if (post._embedded?.author?.[0]?.name) {
    author_name = post._embedded.author[0].name;
  } else if (post.yoast_head_json?.author) {
    author_name = post.yoast_head_json.author;
  }

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    status: post.status,
    featured_media: post.featured_media,
    featured_image_url,
    author_name,
    categories: post.categories,
    tags: post.tags,
    acf: post.acf,
    yoast_head: post.yoast_head,
    yoast_head_json: post.yoast_head_json,
    link: post.link,
    _embedded: post._embedded
  };
}
