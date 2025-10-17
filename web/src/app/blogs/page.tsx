import { Metadata } from 'next';
import BlogsClient from './BlogsClient';

// Generate metadata for blog listing page
export const metadata: Metadata = {
  title: 'Wasgeurtje Blog - Tips en Gidsen over Wasparfum en Wasgeur',
  description: 'Ontdek onze uitgebreide blog met tips, gidsen en advies over wasparfum, wasgeur en alles over het geven van een heerlijke geur aan je kleding. Lees onze expertartikelen.',
  keywords: 'wasparfum blog, wasgeur tips, wasparfum gids, kleding geur, wasparfum advies, washing tips',
  openGraph: {
    title: 'Wasgeurtje Blog - Tips en Gidsen over Wasparfum',
    description: 'Ontdek onze uitgebreide blog met tips en advies over wasparfum en wasgeur. Lees expertartikelen over het geven van een heerlijke geur aan je kleding.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blogs`,
    siteName: 'Wasgeurtje',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wasgeurtje Blog - Tips en Gidsen over Wasparfum',
    description: 'Ontdek onze uitgebreide blog met tips en advies over wasparfum en wasgeur.',
    creator: '@wasgeurtje',
    site: '@wasgeurtje',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/blogs`,
  },
};

export default function BlogsPage() {
  return <BlogsClient />;
}