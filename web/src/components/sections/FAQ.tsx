'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  sectionTitle?: string;
  items?: FAQItem[];
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export default function FAQ({
  sectionTitle,
  items = [],
  backgroundColor = '#ffffff',
  textColor = '#333333',
  accentColor = '#D6AD61'
}: FAQProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    if (openItems.includes(index)) {
      setOpenItems(openItems.filter(i => i !== index));
    } else {
      setOpenItems([...openItems, index]);
    }
  };

  const sectionStyle = {
    backgroundColor,
    color: textColor
  };

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-4xl mx-auto">
        {sectionTitle && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            {sectionTitle}
          </h2>
        )}
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: accentColor }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-opacity-5 transition-colors"
                style={{ 
                  backgroundColor: openItems.includes(index) ? `${accentColor}10` : 'transparent'
                }}
              >
                <h3 className="font-semibold text-lg pr-4">{item.question}</h3>
                {openItems.includes(index) ? (
                  <ChevronUpIcon className="h-5 w-5 flex-shrink-0" style={{ color: accentColor }} />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 flex-shrink-0" style={{ color: accentColor }} />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


