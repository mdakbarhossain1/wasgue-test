"use client";

// ============================
// File: app/components/ProductDetails.tsx
// Description: Product details section with image slider (badge, arrows, variant thumbnails)
// + right-side product info (rating, title, intro, features, qty + add-to-cart with live price,
// availability, shipping perks, and tabs: Details/Perfumes). All data fetched from dummy API.
// ============================

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

// -----------------------------
// Types
// -----------------------------

type VariantImage = {
  id: string;
  src: string;
  alt: string;
};

type ProductData = {
  id: string;
  slug: string;
  title: string;
  intro: string;
  rating: number; // 0..5
  ratingText: string; // e.g., "4.8 (234 reviews)"
  basePrice: number; // price of currently selected variant (can be overridden by variants[])
  currency: string; // e.g., "€"
  sellingBadge?: string; // e.g., "Best seller"
  availability: "in_stock" | "low_stock" | "out_of_stock";
  features: string[];
  images: VariantImage[]; // Master image list used by slider (variant images)
  detailsHtml: string; // for Details tab
  perfumesHtml: string; // for Perfumes tab
};

// -----------------------------
// Helpers
// -----------------------------

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const formatPrice = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.replace(/[^A-Z]/g, "") || "EUR",
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency}${amount.toFixed(2)}`;
  }
};

function StarRating({ value, label }: { value: number; label?: string }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const stars = [
    ...Array(full).fill("full"),
    ...(half ? ["half"] : []),
    ...Array(empty).fill("empty"),
  ];
  return (
    <div className="flex items-center gap-2" aria-label={label || `${value} out of 5 stars`}>
      <div className="flex">
        {stars.map((t, i) => (
          <svg
            key={i}
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill={t === "empty" ? "none" : "currentColor"}
            stroke="currentColor"
            aria-hidden
          >
            {t === "half" ? (
              <>
                <defs>
                  <linearGradient id={`half_${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={`url(#half_${i})`}
                  strokeWidth={1}
                />
              </>
            ) : (
              <path
                d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                strokeWidth={t === "empty" ? 1.5 : 1}
              />
            )}
          </svg>
        ))}
      </div>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}

function AvailabilityPill({ state }: { state: ProductData["availability"] }) {
  const map = {
    in_stock: { text: "In stock", cls: "bg-green-100 text-green-700 border-green-200" },
    low_stock: { text: "Low stock", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    out_of_stock: { text: "Out of stock", cls: "bg-rose-100 text-rose-700 border-rose-200" },
  } as const;
  const cfg = map[state];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.text}
    </span>
  );
}

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex gap-4 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === t.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetails({ slug = "sample-product" }: { slug?: string }) {
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0); // selected image index
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((json: ProductData) => {
        if (!mounted) return;
        setData(json);
        setIdx(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug]);

  const price = useMemo(() => {
    if (!data) return 0;
    return data.basePrice * qty;
  }, [data, qty]);

  const goPrev = () => setIdx((i) => (data ? (i - 1 + data.images.length) % data.images.length : 0));
  const goNext = () => setIdx((i) => (data ? (i + 1) % data.images.length : 0));

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl animate-pulse p-4">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-24 w-full rounded bg-gray-200" />
            <div className="h-12 w-64 rounded bg-gray-200" />
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const current = data.images[idx];

  return (
    <section className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT: Slider */}
        <div className="">
          <div className="relative">
            {/* Main image frame */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100">
              {/* Selling badge */}
              {data.sellingBadge && (
                <div className="absolute left-3 top-3 z-10 rounded-full bg-black/85 px-3 py-1 text-xs font-semibold text-white">
                  {data.sellingBadge}
                </div>
              )}

              {/* Prev / Next arrows */}
              <button
                onClick={goPrev}
                aria-label="Previous image"
                className="group absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md ring-1 ring-black/5 hover:bg-white"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={goNext}
                aria-label="Next image"
                className="group absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md ring-1 ring-black/5 hover:bg-white"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Main image */}
              <Image
                key={current.id}
                src={current.src}
                alt={current.alt}
                fill
                className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.01]"
                sizes="(min-width: 1024px) 600px, 100vw"
                priority
              />
            </div>

            {/* Thumbnail / Variant strip */}
            <div className="mt-4 grid grid-cols-5 gap-3">
              {data.images.map((im, i) => {
                const active = i === idx;
                return (
                  <button
                    key={im.id}
                    onClick={() => setIdx(i)}
                    className={`relative aspect-square overflow-hidden rounded-xl ring-1 transition ${
                      active ? "ring-gray-900" : "ring-gray-200 hover:ring-gray-300"
                    }`}
                    aria-label={`Select image ${i + 1}`}
                  >
                    <Image
                      src={im.src}
                      alt={im.alt}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                    {active && (
                      <span className="absolute inset-0 ring-2 ring-inset ring-gray-900/60" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Product info */}
        <div className="">
          {/* Rating */}
          <StarRating value={data.rating} label={data.ratingText} />

          {/* Title */}
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {data.title}
          </h1>

          {/* Intro */}
          <p className="mt-2 text-gray-600">{data.intro}</p>

          {/* Features */}
          {data.features?.length > 0 && (
            <ul className="mt-4 list-inside list-disc space-y-1 text-gray-700">
              {data.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-gray-300">
              <button
                onClick={() => setQty((q) => clamp(q - 1, 1, 999))}
                className="px-3 py-2 text-gray-700 hover:bg-gray-50"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={qty}
                onChange={(e) => setQty(clamp(parseInt(e.target.value || "1", 10), 1, 999))}
                className="w-14 border-x border-gray-300 py-2 text-center outline-none"
              />
              <button
                onClick={() => setQty((q) => clamp(q + 1, 1, 999))}
                className="px-3 py-2 text-gray-700 hover:bg-gray-50"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 hover:bg-black focus-visible:outline-none"
              onClick={() => alert(`Added ${qty} to cart`)}
            >
              {/* cart icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="9" cy="20" r="1" />
                <circle cx="16" cy="20" r="1" />
                <path d="M2 2h2l3.6 12.59a2 2 0 0 0 2 1.41h7.72a2 2 0 0 0 1.94-1.5L22 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Add to cart</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs font-semibold">
                {formatPrice(data.currency, price)}
              </span>
            </button>
          </div>

          {/* Availability + Perks */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AvailabilityPill state={data.availability} />
            <span className="text-sm text-gray-600">Free Shipping to NL & BE | Earn 15 Wash Points</span>
          </div>

          {/* Tabs */}
          <Tabs
            tabs={[
              { key: "details", label: "Details" },
              { key: "perfumes", label: "Perfumes" },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className="prose prose-sm mt-4 max-w-none prose-headings:mb-2 prose-p:my-2 prose-li:my-0 text-gray-700" suppressHydrationWarning>
            {activeTab === "details" ? (
              <div dangerouslySetInnerHTML={{ __html: data.detailsHtml }} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: data.perfumesHtml }} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================
// File: app/api/products/[slug]/route.ts
// Dummy API route (Next.js App Router) — adjust to your needs
// ============================

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;

  // Simulated catalog
  const mock: Record<string, ProductData> = {
    "sample-product": {
      id: "p_1",
      slug: "sample-product",
      title: "Lux Fabric Perfume — Classic Fresh",
      intro:
        "A premium fabric perfume designed for lasting freshness. Gentle on textiles, bold on aroma.",
      rating: 4.7,
      ratingText: "4.7 · 238 reviews",
      basePrice: 24.9,
      currency: "EUR",
      sellingBadge: "Best Seller",
      availability: "in_stock",
      features: [
        "Long-lasting scent technology",
        "Dermatologically tested",
        "Eco-friendly formula",
        "Made in EU",
      ],
      images: [
        {
          id: "v1",
          src: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1200&auto=format&fit=crop",
          alt: "Product bottle on linen",
        },
        {
          id: "v2",
          src: "https://images.unsplash.com/photo-1585386959984-a41552231656?q=80&w=1200&auto=format&fit=crop",
          alt: "Close-up of spray head",
        },
        {
          id: "v3",
          src: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&auto=format&fit=crop",
          alt: "Bottle with flowers",
        },
        {
          id: "v4",
          src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop",
          alt: "Lifestyle on fabric",
        },
        {
          id: "v5",
          src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
          alt: "Pack shot on pedestal",
        },
      ],
      detailsHtml:
        `<h3>How to use</h3>
         <p>Spray from 20–30 cm onto fabrics. Allow to dry. Avoid delicate silks.</p>
         <h3>Ingredients</h3>
         <p>Aqua, Parfum, Alcohol Denat., Linalool, Limonene.</p>`,
      perfumesHtml:
        `<ul>
           <li>Top: Bergamot, Lemon Zest</li>
           <li>Heart: Jasmine, Lavender</li>
           <li>Base: Cedarwood, Musk</li>
         </ul>`,
    },
  };

  const product = mock[slug] || mock["sample-product"];

  return new Response(JSON.stringify(product), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    status: 200,
  });
}