'use client';

import React from 'react';
import Image from 'next/image';

interface Column {
  image?: {
    url?: string;
    alt?: string;
  };
  title?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface ContentColumnsProps {
  title?: string;
  columns?: Column[];
  columnsPerRow?: number;
  gap?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  centered?: boolean;
}

export default function ContentColumns({
  title,
  columns = [],
  columnsPerRow = 3,
  gap = 'gap-6',
  backgroundColor = '#ffffff',
  textColor = '#333333',
  buttonColor = '#D6AD61',
  centered = true
}: ContentColumnsProps) {
  const sectionStyle = {
    backgroundColor,
    color: textColor
  };

  const getGridClass = () => {
    switch (columnsPerRow) {
      case 2:
        return 'md:grid-cols-2';
      case 3:
        return 'md:grid-cols-3';
      case 4:
        return 'md:grid-cols-4';
      default:
        return 'md:grid-cols-3';
    }
  };

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className={`text-3xl md:text-4xl font-bold mb-12 ${centered ? 'text-center' : ''}`}>
            {title}
          </h2>
        )}
        
        <div className={`grid grid-cols-1 ${getGridClass()} ${gap}`}>
          {columns.map((column, index) => (
            <div
              key={index}
              className={`flex flex-col ${centered ? 'text-center' : ''}`}
              style={{
                backgroundColor: column.backgroundColor || 'transparent',
                color: column.textColor || textColor,
                padding: column.backgroundColor ? '1.5rem' : '0',
                borderRadius: column.backgroundColor ? '0.5rem' : '0'
              }}
            >
              {column.image?.url && (
                <div className="relative h-48 w-full mb-4">
                  <Image
                    src={column.image.url}
                    alt={column.image.alt || column.title || `Column ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg"
                  />
                </div>
              )}
              
              {column.title && (
                <h3 className="text-xl md:text-2xl font-bold mb-3">
                  {column.title}
                </h3>
              )}
              
              {column.content && (
                <div
                  className="prose prose-sm max-w-none mb-4 flex-grow"
                  dangerouslySetInnerHTML={{ __html: column.content }}
                />
              )}
              
              {column.buttonText && column.buttonLink && (
                <div className="mt-auto pt-4">
                  <a
                    href={column.buttonLink}
                    className="inline-block px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: buttonColor }}
                  >
                    {column.buttonText}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

