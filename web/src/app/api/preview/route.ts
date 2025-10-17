import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'page';

  // Check the secret and next parameters
  if (secret !== process.env.PREVIEW_SECRET || (!slug && !id)) {
    return new Response('Invalid token or missing parameters', { status: 401 });
  }

  // Enable Draft Mode by setting the cookie
  draftMode().enable();

  // Redirect based on content type
  let redirectUrl = '/';
  
  switch (type) {
    case 'post':
      redirectUrl = `/blog/${slug || id}`;
      break;
    case 'product':
      redirectUrl = `/wasparfum/${slug || id}`;
      break;
    case 'page':
    default:
      redirectUrl = `/${slug || id}`;
      break;
  }

  // Redirect to the path from the fetched post
  redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  // Exit preview mode
  draftMode().disable();
  
  return new Response(null, { status: 200 });
}


