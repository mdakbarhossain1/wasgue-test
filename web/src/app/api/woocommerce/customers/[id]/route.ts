// Next.js App Router API route: Proxy to WooCommerce Customers endpoint
// Ensures params are awaited to fix "params should be awaited" runtime error

const WC_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wcHeaders() {
  // Basic auth header for WooCommerce REST API
  const token = Buffer.from(`${CK}:${CS}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // IMPORTANT: await params
  const res = await fetch(`${WC_API_URL}/customers/${id}`, {
    headers: wcHeaders(),
    cache: 'no-store',
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // IMPORTANT: await params
  const body = await req.json();

  const res = await fetch(`${WC_API_URL}/customers/${id}`, {
    method: 'PUT',
    headers: wcHeaders(),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
}




