"use client";

import React, { useState } from "react";
import { ACFFAQSection } from "types/wordpress-acf";

interface FAQSectionProps {
  section: ACFFAQSection;
}

export default function FAQSection({ section }: FAQSectionProps) {
  const { section_title, faq } = section;
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  if (!faq || faq.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Modern Gradient Background */}
      {/* <div className="absolute inset-0">
        <div className="absolute inset-0 "></div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#e9c356]/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#1d1d1d]/5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div> */}

      <div className="container mx-auto px-4 relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-16">
          <h2 className="text-[36px] md:text-[46px] font-medium text-[#212529] mb-4 font-['classgarmnd_btroman',sans-serif]">
            {section_title || "Veelgestelde Vragen"}
          </h2>
          <p className="text-lg text-gray-800 font-light max-w-2xl mx-auto">
            Alles wat je wilt weten over onze wasparfums
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faq.map((item, index) => {
            const isOpen = openItems.has(index);

            return (
              <div
                key={`faq-${index}`}
                className="group border border-[#e9c356]"
              >
                {/* Modern Glass Card */}
                <div
                  className={`relative  shadow-lg hover:shadow-2xl transition-all duration-500 border ${
                    isOpen ? "border-[#e9c356]/50" : "border-white/50"
                  } overflow-hidden`}
                >
                  {/* Question Button */}
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full p-4 text-left flex items-center justify-between group relative overflow-hidden"
                    aria-expanded={isOpen}
                  >
                    {/* Hover Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#e9c356]/0 via-[#e9c356]/5 to-[#e9c356]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-center space-x-5 relative z-10">
                      {/* Modern Number Display */}
                      {/* <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isOpen
                            ? "bg-gradient-to-br from-[#e9c356] to-[#d4a843] shadow-lg"
                            : "bg-gradient-to-br from-gray-100 to-gray-200"
                        }`}
                      >
                        <span
                          className={`font-bold text-lg font-['classgarmnd_btroman',sans-serif] ${
                            isOpen ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div> */}

                      {/* Question Text */}
                      <h3
                        className={`text-[24px] font-medium font-['classgarmnd_btroman',sans-serif] transition-colors duration-300 ${
                          isOpen ? "text-[#e9c356]" : "text-[#212529]"
                        }`}
                      >
                        {item.question}
                      </h3>
                    </div>

                    {/* Modern Toggle Icon */}
                    <div
                      className={`relative z-10 transform transition-all text-2xl duration-300  ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <div
                        style={{ color: "#e9c356 !important" }}

                        // className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        //   isOpen
                        //     ? "bg-[#e9c356]/20 text-[#e9c356]"
                        //     : "bg-gray-100 text-gray-400"
                        // }`}
                      >
                        {/* <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg> */}
                        {isOpen ? "-" : "+"}
                      </div>
                    </div>
                  </button>

                  {/* Modern Answer Section */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      isOpen ? "max-h-[500px]" : "max-h-0"
                    }`}
                  >
                    <div className="px-8 pb-8">
                      <div className="relative">
                        <p className="text-gray-800 leading-relaxed text-[17px] font-light">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modern Contact CTA */}
        <div className="mt-20 text-center">
          {/* Glass Card CTA */}
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/50">
            <h3 className="text-[24px] font-medium text-[#212529] mb-3 font-['classgarmnd_btroman',sans-serif]">
              Staat jouw vraag er niet tussen?
            </h3>
            <p className="text-lg text-gray-800 mb-8 font-light max-w-lg">
              Geen probleem! We staan altijd klaar om je te helpen met al je
              vragen over onze wasparfums.
            </p>

            {/* Modern Button */}
            <a
              href="/contact"
              className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-[#e9c356] to-[#d4a843] text-white font-medium rounded-2xl hover:from-[#d4a843] hover:to-[#e9c356] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

              <span className="relative flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Stel je vraag
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
