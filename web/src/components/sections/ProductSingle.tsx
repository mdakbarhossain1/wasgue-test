'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProductSingleProps {
  product?: any; // Product ID or product object
  showDescription?: boolean;
  showPrice?: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

export default function ProductSingle({
  product,
  showDescription = true,
  showPrice = true,
  backgroundColor = '#ffffff',
  textColor = '#333333',
  buttonColor = '#D6AD61'
}: ProductSingleProps) {
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!product) {
      setLoading(false);
      return;
    }

    // If product is already an object with necessary data
    if (typeof product === 'object' && product.post_title) {
      setProductData({
        id: product.ID,
        name: product.post_title,
        slug: product.post_name,
        price: product.price,
        images: product.images || [],
        short_description: product.post_excerpt,
        description: product.post_content
      });
      setLoading(false);
      return;
    }

    // If product is just an ID, fetch it
    if (typeof product === 'number' || typeof product === 'string') {
      setLoading(true);
      fetch(`/api/woocommerce/products/${product}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setProductData(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [product]);

  const sectionStyle = {
    backgroundColor,
    color: textColor
  };

  const buttonStyle = {
    backgroundColor: buttonColor,
    color: '#ffffff'
  };

  if (loading) {
    return (
      <section className="py-12 px-4" style={sectionStyle}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!productData) {
    return null;
  }

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            {productData.images && productData.images[0] ? (
              <img
                src={productData.images[0].src || productData.images[0]}
                alt={productData.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <img
                src="/figma/product-flower-rain.png"
                alt={productData.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{productData.name}</h2>
            
            {showPrice && productData.price && (
              <p className="text-2xl font-semibold mb-6" style={{ color: buttonColor }}>
                €{productData.price}
              </p>
            )}

            {showDescription && productData.short_description && (
              <div
                className="prose prose-lg max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: productData.short_description }}
              />
            )}

            <div className="flex gap-4">
              <Link
                href={`/wasparfum/${productData.slug}`}
                className="inline-block px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={buttonStyle}
              >
                Bekijk Product
              </Link>
              
              <button
                className="px-6 py-3 rounded-lg font-semibold border-2 hover:bg-opacity-10 transition-colors"
                style={{ 
                  borderColor: buttonColor,
                  color: buttonColor,
                  backgroundColor: 'transparent'
                }}
                onClick={() => {
                  // Add to cart functionality would go here
                  console.log('Add to cart:', productData.id);
                }}
              >
                In Winkelwagen
              </button>
            </div>
          </div>
        </div>

        {/* Full Description */}
        {showDescription && productData.description && (
          <div className="mt-12">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: productData.description }}
            />
          </div>
        )}
      </div>
    </section>
  );
}


