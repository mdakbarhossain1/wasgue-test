import React from "react";
import { ACFInfoboxSection } from "types/wordpress-acf";

interface InfoboxSectionProps {
  section: ACFInfoboxSection;
}

export default function InfoboxSection({ section }: InfoboxSectionProps) {
  const { section_title, details, info_type, box } = section;
  console.log("box: ", box);

  if (!box || box.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F0] via-white to-[#e9c356]/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#e9c356]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1d1d1d]/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Modern Header with Animation */}
        {section_title && (
          <div className="text-center mb-16 relative">
            <h2 className="text-[24px] md:text-[32px] font-medium text-[#212529] font-['classgarmnd_btroman',sans-serif] mb-4">
              {section_title}
            </h2>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#e9c356]"></div>
              <div className="w-2 h-2 bg-[#e9c356] rounded-full"></div>
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#e9c356]"></div>
            </div>
          </div>
        )}

        {/* Details Text */}
        {details && (
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-base md:text-xl text-gray-800 leading-relaxed text-center font-light">
              {details}
            </p>
          </div>
        )}

        {/* Modern Info Boxes Grid */}
        <div
          className={`grid gap-6 max-w-6xl mx-auto ${
            info_type === "number"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {box.map((item, index) => (
            <div key={`infobox-${index}`} className="group relative">
              {/* Glass Morphism Card */}
              <div
                className={`${
                  info_type === "number"
                    ? ""
                    : "rounded-br-[50px] rounded-tl-[50px]"
                } relative   h-full p-8  hover:shadow-2xl transition-all duration-500 border-2 border-[#d6ad61] hover:border-[#e9c356]/50 transform hover:-translate-y-3 hover:rotate-1`}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#e9c356]/0 to-[#e9c356]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Content */}
                <div
                  className={`${
                    info_type === "number" ? "text-center" : ""
                  } relative z-10`}
                >
                  {/* Modern Number/Icon Display */}
                  {info_type === "number" ? (
                    <div className="mb-6 -mt-14 ">
                      <div className="inline-flex items-center justify-center w-[50px] h-[50px] bg-gradient-to-br from-[#e9c356] to-[#d4a843] rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <label className="!text-white font-bold text-xl font-['classgarmnd_btroman',sans-serif]">
                          {index + 1}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1d1d1d] to-gray-700 rounded-full shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                        <span className="text-[#e9c356] text-3xl">✨</span>
                      </div>
                    </div>
                  )}

                  {/* Title with Modern Typography */}
                  {item.title && (
                    <h3 className="text-[22px] font-medium text-[#212529] mb-4 font-['classgarmnd_btroman',sans-serif] group-hover:text-[#e9c356] transition-colors duration-300">
                      {item.title}
                    </h3>
                  )}

                  {/* Details with Better Readability */}
                  {item.details && (
                    <p className="text-gray-800 leading-relaxed text-[16px] font-light">
                      {item.details}
                    </p>
                  )}
                </div>

                {/* Decorative Corner Element */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e9c356]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
