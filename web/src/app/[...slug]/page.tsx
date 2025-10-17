import { notFound } from "next/navigation";
import { Metadata } from "next";
import { draftMode } from "next/headers";
import { transformFlexibleContent, extractSEOData } from "utils/wordpress-api";
import { ComponentRenderer } from "components/wordpress/ComponentRegistry";
import Footer from "components/sections/Footer";

interface PageProps {
  params: {
    slug: string[];
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const slugPath = slug.join("/");

    // Fetch page for metadata
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/wordpress/pages?slug=${slugPath}`
    );
    if (!response.ok) {
      return {
        title: "Page Not Found",
        description: "The requested page could not be found.",
      };
    }

    const page = await response.json();
    const seo = extractSEOData(page);

    return {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      authors: seo.author ? [{ name: seo.author }] : [{ name: "Wasgeurtje" }],
      creator: seo.author || "Wasgeurtje",
      publisher: "Wasgeurtje",
      robots: {
        index: seo.robots.index,
        follow: seo.robots.follow,
        googleBot: seo.robots.googleBot,
      },
      openGraph: {
        title: seo.ogTitle,
        description: seo.ogDescription,
        url: seo.ogUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${slugPath}`,
        siteName: seo.ogSiteName,
        images: seo.ogImage
          ? [
              {
                url: seo.ogImage,
                width: 1200,
                height: 630,
                alt: seo.ogTitle,
              },
            ]
          : [],
        locale: seo.ogLocale,
        type: seo.ogType as any,
      },
      twitter: {
        card: seo.twitterCard as any,
        title: seo.twitterTitle,
        description: seo.twitterDescription,
        images: seo.twitterImage ? [seo.twitterImage] : [],
        creator: seo.twitterCreator,
        site: seo.twitterSite,
      },
      alternates: {
        canonical:
          seo.canonical || `${process.env.NEXT_PUBLIC_SITE_URL}/${slugPath}`,
      },
      other: {
        "schema:datePublished": seo.datePublished,
        "schema:dateModified": seo.dateModified,
        "schema:inLanguage": seo.inLanguage,
      },
    };
  } catch (error) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }
}

export default async function DynamicPage({ params }: PageProps) {
  try {
    const { slug } = await params;
    const slugPath = slug.join("/");

    // Fetch page directly from API
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/wordpress/pages?slug=${slugPath}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      notFound();
    }

    const page = await response.json();
    console.log("page_content: ", page);

    if (!page) {
      notFound();
    }

    // Transform ACF flexible content to components
    // The field name is 'page_builder' as seen in WordPress ACF setup
    const components = page.acf?.page_builder
      ? transformFlexibleContent(page.acf.page_builder)
      : [];
    console.log("components_page_acf: ", components);

    // If no ACF content, render the standard content
    const hasACFContent = components.length > 0;
    const seoData = extractSEOData(page);

    // Create structured data for the page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": seoData.ogUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${slugPath}`,
      url: seoData.ogUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${slugPath}`,
      name: seoData.title,
      description: seoData.description,
      isPartOf: {
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/#website`,
      },
      datePublished: seoData.datePublished,
      dateModified: seoData.dateModified,
      inLanguage: seoData.inLanguage,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: process.env.NEXT_PUBLIC_SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: seoData.title,
          },
        ],
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

        <main className="min-h-screen bg-[#F8F6F0]">
          {/* Page Header - only show if no hero section in components */}
          {!hasACFContent ||
          !components.some((c) => c.component === "HeroSection") ? (
            <section className="relative py-20 bg-[#eee]">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h1
                    className="text-4xl md:text-5xl mb-6 text-[#333333]"
                    dangerouslySetInnerHTML={{ __html: page.title }}
                  />
                  {/* {page.title} */}

                  {/* {page.excerpt && (
                    <div
                      className="text-xl text-[#814E1E]"
                      dangerouslySetInnerHTML={{ __html: page.excerpt }}
                    />
                  )} */}
                </div>
              </div>
            </section>
          ) : null}

          {/* ACF Flexible Content */}
          {hasACFContent ? (
            <ComponentRenderer components={components} />
          ) : (
            /* Standard WordPress Content with semantic HTML */
            <>
              {/* <nav aria-label="Breadcrumb" className="py-4 px-4">
                <div className="container mx-auto">
                  <ol className="flex items-center space-x-2 text-sm text-[#2D5016]">
                    <li>
                      <a href="/" className="hover:underline">
                        Home
                      </a>
                    </li>
                    <li>/</li>
                    <li className="opacity-70">{seoData.title}</li>
                  </ol>
                </div>
              </nav> */}

              <article className="py-8 px-4">
                <div className="container mx-auto">
                  <div className="max-w-4xl mx-auto">
                    <header className="mb-8">
                      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[#030303]">
                        {seoData.title}
                      </h1>
                      {seoData.datePublished && (
                        <div className="flex items-center gap-4 text-sm text-[#030303]">
                          <time dateTime={seoData.datePublished}>
                            Gepubliceerd:{" "}
                            {new Date(seoData.datePublished).toLocaleDateString(
                              "nl-NL"
                            )}
                          </time>
                          {seoData.dateModified &&
                            seoData.dateModified !== seoData.datePublished && (
                              <time dateTime={seoData.dateModified}>
                                Gewijzigd:{" "}
                                {new Date(
                                  seoData.dateModified
                                ).toLocaleDateString("nl-NL")}
                              </time>
                            )}
                        </div>
                      )}
                    </header>

                    <section
                      className="prose prose-lg max-w-none
                      prose-headings:text-[#2D5016]
                      prose-headings:font-bold
                      prose-h1:text-4xl
                      prose-h2:text-3xl
                      prose-h3:text-2xl
                      prose-h4:text-xl
                      prose-p:text-gray-800
                      prose-p:leading-relaxed
                      prose-p:mb-4
                      prose-a:text-[#2D5016]
                      prose-a:hover:text-[#1a3009]
                      prose-a:underline
                      prose-strong:text-[#2D5016]
                      prose-strong:font-semibold
                      prose-ul:text-gray-800
                      prose-ul:list-disc
                      prose-ul:pl-6
                      prose-ol:text-gray-800
                      prose-ol:list-decimal
                      prose-ol:pl-6
                      prose-li:mb-2
                      prose-blockquote:border-l-4
                      prose-blockquote:border-[#2D5016]
                      prose-blockquote:pl-4
                      prose-blockquote:text-gray-700
                      prose-blockquote:italic
                      prose-img:rounded-lg
                      prose-img:shadow-md
                      prose-img:mx-auto
                      prose-table:w-full
                      prose-table:border-collapse
                      prose-th:bg-[#2D5016]
                      prose-th:text-white
                      prose-th:p-3
                      prose-th:text-left
                      prose-td:border
                      prose-td:border-gray-300
                      prose-td:p-3
                      prose-td:text-gray-800
                      text-black
                      custom-prose
                      "
                      dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                  </div>
                </div>
              </article>
            </>
          )}

          {/* <Footer /> */}
        </main>
      </>
    );
  } catch (error) {
    console.error("Error loading page:", error);
    notFound();
  }
}

// Generate static params for known pages
export async function generateStaticParams() {
  try {
    // For now, return empty array to use ISR
    // In production, you might want to fetch all pages here
    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
