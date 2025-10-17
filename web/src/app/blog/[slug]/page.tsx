import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReadingProgressBar from "components/blog/ReadingProgressBar";
import FloatingShareButtons from "components/blog/FloatingShareButtons";
import "../blog-styling.css";

interface BlogPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  date: string;
  modified?: string;
  featured_image_url?: string;
  author_name?: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    og_title?: string;
    og_description?: string;
    og_url?: string;
    og_site_name?: string;
    og_locale?: string;
    og_image?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
    twitter_creator?: string;
    twitter_site?: string;
    robots?: {
      index?: string;
      follow?: string;
      googlebot?: string;
    };
    article_tag?: string[];
    schema?: any;
  };
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Generate complete SEO metadata from Yoast
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/wordpress/posts?slug=${slug}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return {
        title: "Blog Post Not Found",
        description: "The requested blog post could not be found.",
      };
    }

    const post: BlogPost = await response.json();

    if (!post) {
      return {
        title: "Blog Post Not Found",
        description: "The requested blog post could not be found.",
      };
    }

    // Complete Yoast SEO integration
    const yoast = post.yoast_head_json || {};
    const fallbackTitle = stripHtml(post.title.rendered);
    const fallbackDescription = stripHtml(post.excerpt.rendered).substring(
      0,
      160
    );

    return {
      title: yoast.title || fallbackTitle,
      description: yoast.description || fallbackDescription,
      keywords: yoast.keywords || "",
      authors: [{ name: post.author_name || "Wasgeurtje" }],
      creator: post.author_name || "Wasgeurtje",
      publisher: "Wasgeurtje",
      robots: {
        index: yoast.robots?.index !== "noindex",
        follow: yoast.robots?.follow !== "nofollow",
        googleBot:
          yoast.robots?.googlebot ||
          "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1",
      },
      alternates: {
        canonical:
          yoast.canonical || `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
      },
      openGraph: {
        title: yoast.og_title || yoast.title || fallbackTitle,
        description:
          yoast.og_description || yoast.description || fallbackDescription,
        url: yoast.og_url || `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
        siteName: yoast.og_site_name || "Wasgeurtje",
        images: yoast.og_image
          ? [
              {
                url: yoast.og_image[0]?.url || "",
                width: yoast.og_image[0]?.width || 1200,
                height: yoast.og_image[0]?.height || 630,
                alt: yoast.og_image[0]?.alt || fallbackTitle,
              },
            ]
          : post.featured_image_url
          ? [
              {
                url: post.featured_image_url,
                width: 1200,
                height: 630,
                alt: fallbackTitle,
              },
            ]
          : [],
        locale: yoast.og_locale || "nl_NL",
        type: "article",
        publishedTime: post.date,
        modifiedTime: post.modified || post.date,
        authors: [post.author_name || "Wasgeurtje"],
        section: "Blog",
        tags: yoast.article_tag || [],
      },
      twitter: {
        card:
          (yoast.twitter_card as "summary_large_image" | "summary") ||
          "summary_large_image",
        title:
          yoast.twitter_title || yoast.og_title || yoast.title || fallbackTitle,
        description:
          yoast.twitter_description ||
          yoast.og_description ||
          yoast.description ||
          fallbackDescription,
        images: yoast.twitter_image
          ? [yoast.twitter_image]
          : yoast.og_image
          ? [yoast.og_image[0]?.url]
          : post.featured_image_url
          ? [post.featured_image_url]
          : [],
        creator: yoast.twitter_creator || "@wasgeurtje",
        site: yoast.twitter_site || "@wasgeurtje",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog Post",
      description:
        "Read our latest blog post about washing and fragrance tips.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;

    // Fetch post from API
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/wordpress/posts?slug=${slug}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      notFound();
    }

    const post: BlogPost = await response.json();

    if (!post) {
      notFound();
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Add JSON-LD structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: stripHtml(post.title.rendered),
      description: stripHtml(post.excerpt.rendered),
      image: post.featured_image_url || "",
      datePublished: post.date,
      dateModified: post.modified || post.date,
      author: {
        "@type": "Person",
        name: post.author_name || "Wasgeurtje",
      },
      publisher: {
        "@type": "Organization",
        name: "Wasgeurtje",
        logo: {
          "@type": "ImageObject",
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/figma/header/logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
      },
    };

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] relative">
          {/* Reading Progress Bar */}
          <ReadingProgressBar />

          {/* Floating Share Buttons */}
          <FloatingShareButtons
            url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`}
            title={stripHtml(post.title.rendered)}
          />

          {/* Animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#e9c356]/10 to-transparent rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#1d1d1d]/5 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
          </div>
          {/* Enhanced header with featured image and modern effects */}
          <header className="relative overflow-hidden">
            {post.featured_image_url ? (
              <div className="relative h-[70vh] max-h-[500px] w-full">
                <Image
                  src={post.featured_image_url}
                  alt={stripHtml(post.title.rendered)}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-end">
                  <div className="max-w-4xl mx-auto px-6 pb-12 w-full">
                    <div className="text-white">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium mb-4 border border-white/30 shadow-lg">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                        <span>Blog artikel</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-white via-[#F8F6F0] to-white bg-clip-text text-transparent drop-shadow-2xl">
                          {stripHtml(post.title.rendered)}
                        </span>
                      </h1>
                      <div className="flex items-center gap-6 text-sm md:text-base bg-white/10 backdrop-blur-lg rounded-full px-6 py-4 inline-flex border border-white/20 shadow-xl">
                        {post.author_name && (
                          <address className="not-italic flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#e9c356] rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {post.author_name.charAt(0)}
                            </div>
                            <span>Door {post.author_name}</span>
                          </address>
                        )}
                        <time
                          dateTime={post.date}
                          className="flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formatDate(post.date)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative py-32 px-6 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1d] via-[#2a2a2a] to-[#1d1d1d]">
                  <div className="absolute inset-0 bg-gradient-conic from-[#e9c356]/20 via-transparent to-[#e9c356]/20 animate-spin-slow"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium mb-8 border border-white/20 shadow-lg">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e9c356] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e9c356]"></span>
                    </span>
                    <span>Blog artikel</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">
                    <span className="bg-gradient-to-r from-white via-[#F8F6F0] to-white bg-clip-text text-transparent animate-gradient-x">
                      {stripHtml(post.title.rendered)}
                    </span>
                  </h1>
                  <div className="flex items-center justify-center gap-6 text-sm md:text-base bg-white/10 backdrop-blur-lg rounded-full px-8 py-5 inline-flex border border-white/20 shadow-xl">
                    {post.author_name && (
                      <address className="not-italic flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#e9c356] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {post.author_name.charAt(0)}
                        </div>
                        <span>Door {post.author_name}</span>
                      </address>
                    )}
                    <time
                      dateTime={post.date}
                      className="flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {formatDate(post.date)}
                    </time>
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* Article content with modern layout */}
          <article className="relative py-16 px-4">
            <div className="max-w-4xl mx-auto relative z-10">
              {/* Futuristic breadcrumbs */}
              <nav className="mb-12 bg-white/70 backdrop-blur-xl rounded-full px-6 py-4 shadow-lg border border-white/50 inline-flex">
                <ol className="flex items-center space-x-3 text-sm text-[#1d1d1d]">
                  <li>
                    <Link
                      href="/"
                      className="group flex items-center gap-2 hover:text-[#e9c356] transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F8F6F0] group-hover:bg-[#e9c356]/20 flex items-center justify-center transition-all duration-300">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <span className="font-medium">Home</span>
                    </Link>
                  </li>
                  <li className="text-gray-400">→</li>
                  <li>
                    <Link
                      href="/blogs"
                      className="group flex items-center gap-2 hover:text-[#e9c356] transition-all duration-300"
                    >
                      <span className="font-medium">Blog</span>
                    </Link>
                  </li>
                  <li className="text-gray-400">→</li>
                  <li className="text-gray-600 font-medium max-w-xs truncate">
                    {stripHtml(post.title.rendered).substring(0, 30)}...
                  </li>
                </ol>
              </nav>

              {/* Main content wrapper with glassmorphism */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/50">
                {/* Article body with enhanced CSS styling */}
                <section
                  className="prose prose-lg max-w-none prose-headings:text-[#1d1d1d] prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b-2 prose-h1:border-[#1d1d1d] prose-h1:pb-3 prose-h2:text-3xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:border-b-2 prose-h2:border-[#e9c356] prose-h2:pb-2 prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:text-[#1d1d1d] prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6 prose-p:text-[#333333] prose-p:leading-relaxed prose-p:mb-5 prose-p:text-lg prose-a:text-[#e9c356] prose-a:hover:text-[#1d1d1d] prose-a:underline prose-a:font-medium prose-a:transition-colors prose-strong:text-[#1d1d1d] prose-strong:font-semibold prose-ul:text-[#333333] prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3 prose-ol:text-[#333333] prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-li:mb-2 prose-li:relative prose-li:pl-6 prose-li:before:content-['•'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-[#e9c356] prose-li:before:font-bold prose-li:before:text-base prose-blockquote:border-l-4 prose-blockquote:border-[#e9c356] prose-blockquote:bg-[#F8F6F0] prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:text-[#333333] prose-blockquote:italic prose-blockquote:rounded-r-lg prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto prose-img:my-8 prose-img:border-2 prose-img:border-gray-200 prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:shadow-lg prose-table:rounded-lg prose-table:overflow-hidden prose-th:bg-[#1d1d1d] prose-th:text-white prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:text-lg prose-td:border-0 prose-td:p-4 prose-td:text-[#333333] prose-td:bg-white prose-td:even:bg-gray-50 prose-td:text-base"
                  dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                />
              </div>
            </div>
          </article>

          {/* Modern CTA section */}
          <section className="py-20 px-4 relative">
            <div className="max-w-4xl mx-auto">
              {/* Newsletter signup with glassmorphism */}
              <div className="bg-gradient-to-r from-[#1d1d1d] to-[#333333] rounded-3xl p-12 text-white relative overflow-hidden mb-16">
                <div className="absolute inset-0 bg-gradient-conic from-[#e9c356]/20 via-transparent to-[#e9c356]/20 animate-spin-slow"></div>
                <div className="relative z-10 text-center">
                  <h3 className="text-3xl font-bold mb-4">
                    Mis geen enkel artikel
                  </h3>
                  <p className="text-lg opacity-90 mb-8">
                    Meld je aan voor onze nieuwsbrief en ontvang wekelijks de
                    beste tips
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Je e-mailadres"
                      className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-[#e9c356] transition-colors"
                    />
                    <button className="px-8 py-4 bg-gradient-to-r from-[#e9c356] to-[#d4a843] rounded-full font-semibold text-[#1d1d1d] hover:shadow-lg hover:shadow-[#e9c356]/30 transform hover:scale-105 transition-all duration-300">
                      Aanmelden
                    </button>
                  </div>
                </div>
              </div>

              {/* Back to blog with modern styling */}
              <div className="text-center">
                <Link
                  href="/blogs"
                  className="group inline-flex items-center gap-3 bg-white/80 backdrop-blur-lg hover:bg-white border border-gray-200 text-[#1d1d1d] font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F8F6F0] group-hover:bg-[#e9c356]/20 flex items-center justify-center transition-all duration-300">
                    <svg
                      className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                  <span>Terug naar blog overzicht</span>
                  <span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#e9c356] to-[#d4a843] text-white text-sm font-medium rounded-full shadow-md">
                    Alle artikelen
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading blog post:", error);
    notFound();
  }
}
