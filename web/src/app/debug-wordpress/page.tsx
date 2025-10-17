"use client";

import { useState } from 'react';

export default function DebugWordPressPage() {
  const [slug, setSlug] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = async () => {
    if (!slug) {
      setError('Please enter a page slug');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/wordpress/pages?slug=${slug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const pageData = await response.json();
      setData(pageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WordPress Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Enter page slug (e.g., contact, about)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={fetchPageData}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Page'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}
        </div>

        {data && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-semibold">ID:</dt>
                  <dd>{data.id}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Slug:</dt>
                  <dd>{data.slug}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Title:</dt>
                  <dd>{data.title}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Status:</dt>
                  <dd>{data.status}</dd>
                </div>
              </dl>
            </div>

            {/* ACF Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">ACF Data</h2>
              <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                <pre className="text-sm">{JSON.stringify(data.acf, null, 2)}</pre>
              </div>
            </div>

            {/* Debug ACF (if available) */}
            {data._debug_acf && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Debug ACF (Raw)</h2>
                <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                  <pre className="text-sm">{JSON.stringify(data._debug_acf, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* SEO Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">SEO Data</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold">SEO Title:</dt>
                  <dd>{data.seo_title || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">SEO Description:</dt>
                  <dd>{data.seo_description || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">OG Image:</dt>
                  <dd>{data.og_image || 'Not set'}</dd>
                </div>
              </dl>
            </div>

            {/* Full Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Full Response</h2>
              <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


