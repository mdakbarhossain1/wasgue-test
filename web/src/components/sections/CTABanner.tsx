'use client';

import React from 'react';
import Link from 'next/link';

interface CTABannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  buttonColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  fullWidth?: boolean;
}

export default function CTABanner({
  title,
  subtitle,
  buttonText,
  buttonUrl,
  backgroundColor = '#D6AD61',
  backgroundImage,
  textColor = '#ffffff',
  buttonColor = '#333333',
  overlay = true,
  overlayOpacity = 0.6,
  fullWidth = false
}: CTABannerProps) {
  const sectionStyle = {
    backgroundColor,
    color: textColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative' as const
  };

  const buttonStyle = {
    backgroundColor: buttonColor,
    color: buttonColor === '#333333' ? '#ffffff' : '#333333'
  };

  return (
    <section 
      className={`py-16 md:py-24 px-4 ${fullWidth ? '' : 'my-12'}`} 
      style={sectionStyle}
    >
      {/* Overlay */}
      {backgroundImage && overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundColor,
            opacity: overlayOpacity
          }}
        />
      )}
      
      {/* Content */}
      <div className={`${fullWidth ? 'max-w-6xl' : 'max-w-4xl'} mx-auto relative z-10`}>
        <div className="text-center">
          {subtitle && (
            <p className="text-lg md:text-xl mb-4 opacity-90">
              {subtitle}
            </p>
          )}
          
          {title && (
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              {title}
            </h2>
          )}
          
          {buttonText && buttonUrl && (
            <Link
              href={buttonUrl}
              className="inline-block px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
              style={buttonStyle}
            >
              {buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}


