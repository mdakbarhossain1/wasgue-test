import { NextRequest, NextResponse } from 'next/server';

// WordPress API credentials (same as WooCommerce site)
const WP_API_URL = process.env.WORDPRESS_API_URL || 'https://wasgeurtje.nl/wp-json/wp/v2';
const WC_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wpHeaders() {
  // For public content, try without auth first
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'Wasgeurtje-Headless/1.0'
  } as Record<string, string>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    
    if (!slug && !id) {
      return NextResponse.json({ message: 'Page slug or ID required' }, { status: 400 });
    }

    // Build query params
    let queryParams = '';
    if (slug) {
      queryParams = `?slug=${slug}`;
    } else if (id) {
      queryParams = `/${id}`;
    }

    console.log(`🔄 WordPress API: Fetching page with ${slug ? 'slug: ' + slug : 'id: ' + id}`);
    
    // First, try to fetch from pages endpoint with full SEO data
    let response = await fetch(`${WP_API_URL}/pages${queryParams}${slug ? '&' : '?'}_fields=id,title,content,excerpt,slug,date,modified,status,featured_media,template,parent,menu_order,meta,acf,yoast_head,yoast_head_json,link`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    console.log(`🔄 WordPress API: Response status ${response.status}`);

    let data;
    if (response.ok) {
      data = await response.json();
      console.log(`🔄 WordPress API: Received data`, Array.isArray(data) ? `Array with ${data.length} items` : 'Single object');
      
      // If we queried by slug, it returns an array
      if (slug && Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
    } else {
      const errorText = await response.text();
      console.error(`🔄 WordPress API Error: ${response.status} - ${errorText}`);
      return NextResponse.json({ 
        message: 'Page not found',
        debug: {
          status: response.status,
          error: errorText,
          endpoint: `${WP_API_URL}/pages${queryParams}`
        }
      }, { status: 404 });
    }

    // Fetch ACF fields if available
    let acfData = {};
    if (data.id) {
      try {
        const acfResponse = await fetch(`${WP_API_URL}/pages/${data.id}?acf_format=standard`, {
          headers: wpHeaders(),
        });
        
        if (acfResponse.ok) {
          const fullData = await acfResponse.json();
          acfData = fullData.acf || {};
        }
      } catch (error) {
        console.error('Error fetching ACF data:', error);
      }
    }

    // Transform WordPress page data to our format
    const transformedPage: any = {
      id: data.id,
      slug: data.slug,
      title: data.title?.rendered || '',
      content: data.content?.rendered || '',
      excerpt: data.excerpt?.rendered || '',
      date: data.date,
      modified: data.modified,
      status: data.status,
      featured_media: data.featured_media,
      template: data.template,
      parent: data.parent,
      menu_order: data.menu_order,
      meta: data.meta || {},
      acf: acfData,
      // Debug: log ACF data to see structure
      _debug_acf: process.env.NODE_ENV === 'development' ? acfData : undefined,
      // SEO fields
      yoast_meta: data.yoast_head_json || {},
      seo_title: data.yoast_head_json?.title || data.title?.rendered || '',
      seo_description: data.yoast_head_json?.description || '',
      og_image: data.yoast_head_json?.og_image?.[0]?.url || '',
      // Contact specific fields from ACF
      contact_info: (acfData as any).contact_info || {},
      contact_form: (acfData as any).contact_form || {},
      office_locations: (acfData as any).office_locations || [],
      business_hours: (acfData as any).business_hours || {},
      social_links: (acfData as any).social_links || [],
    };

    // If we have featured media, fetch it
    if (data.featured_media) {
      try {
        const mediaResponse = await fetch(`${WP_API_URL}/media/${data.featured_media}`, {
          headers: wpHeaders(),
        });
        
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          transformedPage.featured_image = {
            url: mediaData.source_url,
            alt: mediaData.alt_text || '',
            title: mediaData.title?.rendered || '',
            sizes: mediaData.media_details?.sizes || {}
          };
        }
      } catch (error) {
        console.error('Error fetching featured media:', error);
      }
    }

    return NextResponse.json(transformedPage);

  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { message: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}
