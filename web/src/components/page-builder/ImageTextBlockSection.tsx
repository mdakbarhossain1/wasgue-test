import React from "react";
import Image from "next/image";
import { ACFImageTextBlockSection, WordPressImage } from "types/wordpress-acf";

interface ImageTextBlockSectionProps {
  section: ACFImageTextBlockSection & { image: WordPressImage };
}

const gradientbg = "/figma/gradientbg.jpg";

export default function ImageTextBlockSection({
  section,
}: ImageTextBlockSectionProps) {
  const { image, title, content, list_type, list, extra_content } = section;

  const getListIcon = (index: number) => {
    switch (list_type) {
      case "number":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#e9c356] to-[#d4a843] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{index + 1}</span>
          </div>
        );
      case "checked":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-[#333] rounded-full flex items-center justify-center">
            <label className="!text-[#e9c356] font-bold text-sm">✓</label>
          </div>
        );
      case "timeline":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#1d1d1d] to-gray-700 rounded-full flex items-center justify-center relative">
            <span className="text-[#e9c356] font-bold text-sm">●</span>
            {index < list.length - 1 && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#1d1d1d] to-gray-300"></div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  const sectionStyle =
    title === "Wat is wasparfum?"
      ? { backgroundImage: `url(${gradientbg})` }
      : {};

  const sectionClasses =
    title === "Wat is wasparfum?"
      ? "py-8 sm:py-16 bg-no-repeat bg-cover bg-center"
      : "py-10 sm:py-16  bg-gradient-to-br from-white to-[#F8F6F0]";
  return (
    <section style={sectionStyle} className={sectionClasses}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center lg:items-start max-w-7xl mx-auto">
          {/* Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden ">
              {image && image.url && (
                <Image
                  src={image.url}
                  alt={image.alt || title || "Content image"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="">
            {/* Title */}
            {title && (
              <h2 className="text-2xl sm:text-[32px] font-medium font-['classgarmnd_btroman',sans-serif] mb-2 sm:mb-6">
                {title}
              </h2>
            )}

            {/* Main Content */}
            {content && (
              <div
                style={{ color: "white !important" }}
                className="prose prose-lg max-w-none prose-p:leading-relaxed prose-p:text-lg was-text-size"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

            {/* List Items */}
            {list && list.length > 0 && (
              <div className="sm:gap-4 gap-3 grid grid-cols-2 mt-5">
                {list.map((item, index) => (
                  <div
                    key={`list-item-${index}`}
                    className="flex items-start space-x-2 sm:space-x-4">
                    {getListIcon(index)}
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-medium leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extra Content */}
            {extra_content && (
              <div
                className="prose prose-lg max-w-none prose-p:text-gray-800 prose-p:leading-relaxed prose-p:text-lg prose-strong:text-[#1d1d1d] mt-8 lg:mt-0 sm:pt-4"
                dangerouslySetInnerHTML={{ __html: extra_content }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
