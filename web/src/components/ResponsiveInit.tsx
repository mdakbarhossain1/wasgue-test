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
