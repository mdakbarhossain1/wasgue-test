'use client';

import React, { useState } from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';

interface VideoProps {
  videoThumbnail?: string;
  videoUrl?: string;
  videoEmbed?: string;
  title?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function Video({
  videoThumbnail,
  videoUrl,
  videoEmbed,
  title,
  backgroundColor = '#ffffff',
  textColor = '#333333'
}: VideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const sectionStyle = {
    backgroundColor,
    color: textColor
  };

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            {title}
          </h2>
        )}
        
        <div className="relative rounded-lg overflow-hidden shadow-xl aspect-video bg-black">
          {!isPlaying && videoThumbnail ? (
            <>
              <img
                src={videoThumbnail}
                alt={title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-colors"
              >
                <div className="bg-white rounded-full p-5 shadow-lg hover:scale-110 transition-transform">
                  <PlayIcon className="h-12 w-12 text-[#D6AD61]" />
                </div>
              </button>
            </>
          ) : (
            <>
              {videoEmbed ? (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: videoEmbed }}
                />
              ) : videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title={title || 'YouTube video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No video available</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}


