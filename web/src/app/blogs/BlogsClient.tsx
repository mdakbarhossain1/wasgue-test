"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  date: string;
  featured_image_url?: string;
  author_name?: string;
  categories?: number[];
}

function BlogCard({ post }: { post: BlogPost }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Strip HTML tags from excerpt
  const stripHtml = (html: string): string => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&[^;]+;/g, " ")
      .trim();
  };

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article
        className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-[#D6AD61] h-full flex flex-col"
        style={{ borderColor: "#E5E5E5" }}>
        {/* Featured Image */}
        <div className="relative h-[200px] bg-[#F8F6F0] flex items-center justify-center">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt={post.title.rendered}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <div className="text-[#D6AD61] text-6xl">📝</div>
          )}
        </div>

        {/* Blog Info */}
        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-['EB_Garamond'] font-semibold text-[#212529] mb-3 line-clamp-2 group-hover:text-[#D6AD61] transition-colors">
            {post.title.rendered}
          </h2>

          {/* Date and Author */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.author_name && (
              <>
                <span className="mx-2">•</span>
                <span>{post.author_name}</span>
              </>
            )}
          </div>

          {/* Excerpt */}
          <div className="text-gray-700 text-sm leading-relaxed flex-1">
            <p className="line-clamp-3">{stripHtml(post.excerpt.rendered)}</p>
          </div>

          {/* Read More */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-[#D6AD61] font-medium text-sm group-hover:underline">
              Lees verder →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function LoadingCard() {
  return (
    <div
      className="bg-white border-2 rounded-xl overflow-hidden animate-pulse"
      style={{ borderColor: "#E5E5E5" }}>
      <div className="h-[200px] bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function BlogsClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(
        `/api/wordpress/posts?page=${pageNum}&per_page=12`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        if (append) {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }

        // Check if there are more posts
        if (data.length < 12) {
          setHasMore(false);
        }
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-3xl font-['EB_Garamond'] font-semibold text-[#212529]">
              Blog
            </h1>
            <p className="mt-2 text-gray-600">
              Ontdek onze tips en gidsen over wasparfum en wasgeur
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-3xl font-['EB_Garamond'] font-semibold text-[#212529]">
              Blog
            </h1>
          </header>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Er is iets misgegaan
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPosts()}
              className="px-6 py-2 bg-[#D6AD61] text-white rounded-lg hover:bg-[#C19B55] transition-colors">
              Probeer opnieuw
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="mb-8 bg-[#eee] py-10 md:py-20">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="md:text-5xl text-3xl font-['EB_Garamond'] font-semibold text-[#212529]">
            Blog
          </h1>
          <p className="mt-2 text-gray-600">
            Ontdek onze tips en gidsen over wasparfum en wasgeur
          </p>
          {posts.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {posts.length} artikel{posts.length !== 1 ? "en" : ""} gevonden
            </p>
          )}
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          <>
            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-[#D6AD61] text-white rounded-lg hover:bg-[#C19B55] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loadingMore ? "Laden..." : "Meer artikelen laden"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Geen artikelen gevonden
            </h2>
            <p className="text-gray-600">
              Er zijn momenteel geen blog artikelen beschikbaar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
