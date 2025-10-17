import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Secret token for webhook security
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || 'your-secret-token-here';

interface RevalidatePayload {
  secret: string;
  type: 'page' | 'post' | 'product' | 'all';
  id?: number;
  slug?: string;
  path?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const data: RevalidatePayload = await request.json();

    // Verify secret token
    if (data.secret !== REVALIDATION_SECRET) {
      return NextResponse.json(
        { message: 'Invalid secret token' },
        { status: 401 }
      );
    }

    console.log('Revalidation request received:', {
      type: data.type,
      id: data.id,
      slug: data.slug,
      path: data.path
    });

    // Revalidate based on type
    switch (data.type) {
      case 'page':
        if (data.slug) {
          // Revalidate the specific page
          revalidatePath(`/${data.slug}`);
          revalidatePath(`/api/wordpress/pages?slug=${data.slug}`);
        }
        if (data.path) {
          revalidatePath(data.path);
        }
        break;

      case 'post':
        // Revalidate blog listing and specific post
        revalidatePath('/blog');
        if (data.slug) {
          revalidatePath(`/blog/${data.slug}`);
        }
        break;

      case 'product':
        // Revalidate shop pages and specific product
        revalidatePath('/products');
        revalidatePath('/shop');
        if (data.slug) {
          revalidatePath(`/wasparfum/${data.slug}`);
          revalidatePath(`/products/${data.slug}`);
        }
        // Revalidate product API endpoints
        if (data.id) {
          revalidateTag(`product-${data.id}`);
        }
        break;

      case 'all':
        // Nuclear option - revalidate everything
        revalidatePath('/', 'layout');
        break;

      default:
        // Revalidate specific tags if provided
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => revalidateTag(tag));
        }
    }

    return NextResponse.json({
      success: true,
      message: 'Revalidation triggered successfully',
      revalidated: {
        type: data.type,
        slug: data.slug,
        path: data.path,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Revalidation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret token' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'Revalidation endpoint is working',
    usage: {
      method: 'POST',
      body: {
        secret: 'your-secret-token',
        type: 'page|post|product|all',
        slug: 'optional-page-slug',
        path: 'optional-path-to-revalidate',
        tags: ['optional', 'cache', 'tags']
      }
    }
  });
}


