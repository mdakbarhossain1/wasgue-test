'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/20 backdrop-blur-sm z-50">
      <div 
        className="h-full bg-gradient-to-r from-[#e9c356] via-[#d4a843] to-[#e9c356] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        <div className="h-full bg-white/30 animate-shimmer"></div>
      </div>
    </div>
  );
}

