'use client';

import React from 'react';

interface InfoboxProps {
  title?: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  image?: {
    url?: string;
    alt?: string;
  };
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export default function Infobox({
  title,
  subtitle,
  content,
  icon,
  image,
  backgroundColor = '#f8f8f8',
  textColor = '#333333',
  iconColor = '#D6AD61',
  borderRadius = 8,
  shadow = true,
  alignment = 'center'
}: InfoboxProps) {
  const boxStyle = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    boxShadow: shadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
    textAlign: alignment as any
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="p-8" style={boxStyle}>
          {/* Icon or Image */}
          {icon && (
            <div className="mb-6 flex justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
              >
                {icon}
              </div>
            </div>
          )}
          
          {image?.url && (
            <div className="mb-6">
              <img
                src={image.url}
                alt={image.alt || title || 'Infobox image'}
                className="mx-auto rounded-lg max-w-full h-auto"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          {/* Content */}
          {subtitle && (
            <p className="text-sm uppercase tracking-wide mb-2" style={{ color: iconColor }}>
              {subtitle}
            </p>
          )}
          
          {title && (
            <h3 className="text-2xl md:text-3xl font-bold mb-4">{title}</h3>
          )}
          
          {content && (
            <div
              className="prose prose-lg max-w-none mx-auto"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
    </section>
  );
}


