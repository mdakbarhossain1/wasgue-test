"use client";

import React from "react";

interface TimelineItem {
  date?: string;
  title?: string;
  description?: string;
  icon?: string;
}

interface TimelineProps {
  title?: string;
  items?: TimelineItem[];
  footer?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  layout?: "vertical" | "horizontal";
}

export default function Timeline({
  title,
  items = [],
  footer,
  backgroundColor = "#ffffff",
  textColor = "#333333",
  accentColor = "#D6AD61",
  layout = "vertical",
}: TimelineProps) {
  const sectionStyle = {
    backgroundColor,
    color: textColor,
  };

  if (layout === "horizontal") {
    return (
      <section className="py-12 px-4" style={sectionStyle}>
        <div className="max-w-6xl mx-auto">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {title}
            </h2>
          )}

          <div className="overflow-x-auto">
            <div className="flex space-x-8 pb-4">
              {items.map((item, index) => (
                <div key={index} className="flex-shrink-0 w-64">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-4"
                      style={{ backgroundColor: accentColor }}>
                      {index + 1}
                    </div>
                    {index < items.length - 1 && (
                      <div
                        className="absolute top-6 left-12 w-full h-0.5"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </div>

                  <div className="mt-4">
                    {item.date && (
                      <p
                        className="text-sm font-semibold mb-2"
                        style={{ color: accentColor }}>
                        {item.date}
                      </p>
                    )}
                    {item.title && (
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    )}
                    {item.description && (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Vertical layout (default)
  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {title}
          </h2>
        )}

        <div className="relative">
          {/* Vertical center line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2"
            style={{ backgroundColor: accentColor }}
          />

          <div className="space-y-16">
            {items.map((item, index) => (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row items-center md:items-start ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}>
                {/* Left / Right side (logo) */}
                <div
                  className={`w-full md:w-1/2 flex justify-end md:justify-${
                    index % 2 === 0 ? "end" : "start"
                  } md:px-8 mb-6 md:mb-0`}>
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt={item.title || `Icon ${index + 1}`}
                      className="object-contain"
                    />
                  )}
                </div>

                {/* Center marker (number circle) */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-md top-0 md:top-auto"
                  style={{ backgroundColor: accentColor }}>
                  {index + 1}
                </div>

                {/* Right / Left side (content) */}
                <div
                  className={`w-full md:w-1/2 md:px-8 ${
                    index % 2 === 0 ? "text-left" : "text-right"
                  }`}>
                  {item.date && (
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: accentColor }}>
                      {item.date}
                    </p>
                  )}
                  {item.title && (
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  )}
                  {item.description && (
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Footer content */}
        {footer && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div
              className="prose prose-lg max-w-none text-center timeline-prose"
              dangerouslySetInnerHTML={{ __html: footer }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
