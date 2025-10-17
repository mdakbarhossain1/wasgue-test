# Responsive Implementation for Wasgeurtje Landing Page

This document describes the responsive implementation for the Wasgeurtje landing page, ensuring the site looks and functions properly across all device sizes from mobile phones to desktop monitors.

## Breakpoints

We use the following breakpoints, matching Tailwind CSS defaults:

- **sm**: 640px and above (small tablets and larger)
- **md**: 768px and above (tablets and larger)
- **lg**: 1024px and above (desktops and larger)
- **xl**: 1280px and above (large desktops)
- **2xl**: 1536px and above (extra large desktops)

## Core Technologies and Approaches

### 1. Media Query Hook

We've implemented a custom React hook (`useMediaQuery`) that allows components to respond to media queries:

```tsx
// /src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Predefined breakpoints matching tailwind defaults
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};
```

### 2. Viewport Height Fix

Mobile browsers have issues with viewport height (`vh`) units. We implement a JavaScript fix:

```tsx
// /src/components/ResponsiveInit.tsx
"use client";

import { useEffect } from 'react';

export default function ResponsiveInit() {
  useEffect(() => {
    // Function to set the viewport height variable
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial call
    setViewportHeight();

    // Update on resize
    window.addEventListener('resize', setViewportHeight);
    
    // Cleanup
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  return null;
}
```

This adds a CSS variable `--vh` that can be used with `calc(var(--vh, 1vh) * 100)` instead of `100vh`.

### 3. Responsive Typography

We implement different font sizes for mobile and desktop, defined in `/src/app/globals.css`:

```css
/* Mobile typography (default) */
.h1 { font-size: 36px; }
.h2 { font-size: 28px; }
.h3 { font-size: 22px; }
/* ... */

/* Desktop typography */
@media (min-width: 768px) {
  .h1 { font-size: 56px; }
  .h2 { font-size: 32px; }
  .h3 { font-size: 24px; }
  /* ... */
}
```

## Component-Level Responsive Strategies

### Header

- Mobile: Hamburger menu that opens a full-width dropdown
- Desktop: Traditional horizontal navigation

### Hero Section

- Mobile: Stacked layout with smaller text and images
- Desktop: Split layout with larger text and images

### Categories

- Mobile: Single column grid
- Tablet: Two column grid
- Desktop: Four column grid

### Testimonials

- Custom carousel with touch support for mobile
- Responsive card sizes based on screen width
- Navigation controls optimized for touch on mobile

### Footer

- Mobile: Stacked columns, centered content
- Desktop: Multi-column layout with aligned content

## Responsive Images

We ensure images are responsive by:

1. Using appropriate sizing for different screen sizes
2. Using CSS `object-fit` and `object-position` to control how images display
3. Limiting maximum widths to avoid stretched images

## Mobile-Specific Features

- Touch-friendly targets (minimum 44x44px) for better mobile accessibility
- Simplified UI for smaller screens
- Reduced padding and margins on mobile

## Testing

The responsive design has been tested on:

- iPhone (iOS Safari) - small screens
- Android devices - various screen sizes
- Tablets (iPad) - medium screens
- Desktop browsers - large screens

## Future Improvements

- Implement proper responsive images with `next/image` and srcset
- Add skeleton loaders for better perceived performance
- Implement responsive font sizes using fluid typography
