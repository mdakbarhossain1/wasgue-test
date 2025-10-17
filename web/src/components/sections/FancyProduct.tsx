'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FancyProductProps {
  title?: string;
  product?: {
    id?: number;
    name?: string;
    slug?: string;
    price?: string;
    regular_price?: string;
    sale_price?: string;
    images?: Array<{ src: string; alt?: string }>;
    short_description?: string;
    description?: string;
  };
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  showPrice?: boolean;
  showDescription?: boolean;
  buttonText?: string;
  layout?: 'centered' | 'split' | 'overlay';
}

export default function FancyProduct({
  title,
  product,
  backgroundColor = '#ffffff',
  textColor = '#333333',
  accentColor = '#D6AD61',
  showPrice = true,
  showDescription = true,
  buttonText = 'Shop nu',
  layout = 'centered'
}: FancyProductProps) {
  if (!product) {
    return null;
  }

  const sectionStyle = {
    backgroundColor,
    color: textColor
  };

  const hasSale = product.sale_price && product.regular_price && product.sale_price !== product.regular_price;
  const displayPrice = product.sale_price || product.price;

  const renderCenteredLayout = () => (
    <div className="text-center">
      {product.images && product.images.length > 0 && (
        <div className="relative h-96 w-full max-w-md mx-auto mb-8">
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name || 'Product'}
            fill
            style={{ objectFit: 'contain' }}
            className="rounded-lg"
          />
          {hasSale && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              SALE
            </div>
          )}
        </div>
      )}
      
      <h2 className="text-4xl font-bold mb-4">{product.name}</h2>
      
      {showPrice && (
        <div className="mb-6">
          {hasSale && (
            <span className="text-2xl text-gray-500 line-through mr-3">€{product.regular_price}</span>
          )}
          <span className="text-3xl font-bold" style={{ color: accentColor }}>€{displayPrice}</span>
        </div>
      )}
      
      {showDescription && product.short_description && (
        <div
          className="prose prose-lg max-w-2xl mx-auto mb-8"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}
      
      <Link
        href={`/wasparfum/${product.slug}`}
        className="inline-block px-8 py-3 rounded-full font-bold text-white transition-all duration-300 hover:scale-105"
        style={{ backgroundColor: accentColor }}
      >
        {buttonText}
      </Link>
    </div>
  );

  const renderSplitLayout = () => (
    <div className="flex flex-col md:flex-row gap-8 items-center">
      {product.images && product.images.length > 0 && (
        <div className="md:w-1/2 relative h-96 w-full">
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name || 'Product'}
            fill
            style={{ objectFit: 'contain' }}
            className="rounded-lg"
          />
          {hasSale && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              SALE
            </div>
          )}
        </div>
      )}
      
      <div className="md:w-1/2">
        <h2 className="text-4xl font-bold mb-4">{product.name}</h2>
        
        {showPrice && (
          <div className="mb-6">
            {hasSale && (
              <span className="text-xl text-gray-500 line-through mr-3">€{product.regular_price}</span>
            )}
            <span className="text-3xl font-bold" style={{ color: accentColor }}>€{displayPrice}</span>
          </div>
        )}
        
        {showDescription && product.short_description && (
          <div
            className="prose prose-lg mb-8"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}
        
        <Link
          href={`/wasparfum/${product.slug}`}
          className="inline-block px-8 py-3 rounded-full font-bold text-white transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: accentColor }}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );

  const renderOverlayLayout = () => (
    <div className="relative">
      {product.images && product.images.length > 0 && (
        <div className="relative h-[500px] w-full">
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name || 'Product'}
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg" />
          
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
            <div>
              {hasSale && (
                <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  AANBIEDING
                </div>
              )}
              
              <h2 className="text-5xl font-bold mb-4">{product.name}</h2>
              
              {showPrice && (
                <div className="mb-6">
                  {hasSale && (
                    <span className="text-2xl line-through mr-3">€{product.regular_price}</span>
                  )}
                  <span className="text-4xl font-bold">€{displayPrice}</span>
                </div>
              )}
              
              {showDescription && product.short_description && (
                <div
                  className="prose prose-lg prose-invert max-w-2xl mx-auto mb-8"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              )}
              
              <Link
                href={`/wasparfum/${product.slug}`}
                className="inline-block px-8 py-3 rounded-full font-bold bg-white transition-all duration-300 hover:scale-105"
                style={{ color: textColor }}
              >
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-6xl mx-auto">
        {title && !['overlay'].includes(layout) && (
          <h1 className="text-center text-3xl md:text-4xl font-bold mb-8">
            {title}
          </h1>
        )}
        
        {layout === 'centered' && renderCenteredLayout()}
        {layout === 'split' && renderSplitLayout()}
        {layout === 'overlay' && renderOverlayLayout()}
      </div>
    </section>
  );
}


