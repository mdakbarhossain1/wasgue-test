"use client";

import React from "react";
import Image from "next/image";

interface ImageTextBlockProps {
  image?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  title?: string;
  content?: string;
  list?: Array<{
    item?: string;
    text?: string;
  }>;
  extraContent?: string;
  imagePosition?: "left" | "right";
  backgroundColor?: string;
  textColor?: string;
}

export default function ImageTextBlock({
  image,
  title,
  content,
  list,
  extraContent,
  imagePosition = "left",
  backgroundColor = "#ffffff",
  textColor = "#333333",
}: ImageTextBlockProps) {
  const sectionStyle = {
    backgroundColor,
    color: textColor,
  };

  console.log(list, "listlistlist");

  const renderContent = () => (
    <div className="flex-1 flex flex-col text-black">
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
      )}

      {content && (
        <div
          className="prose prose-lg max-w-none mb-6 space-y-3 waarom-wasgeurtje-btn"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {list && (
        // <ul className="space-y-4">
        //   {list.map((item, index) => (
        //     <li key={index} className="flex items-center ">
        //       <p
        //         className={`text-white mr-2 w-10 h-10 bg-[#e9c356] flex-shrink-0 flex items-center justify-center rounded-full font-semibold after:content-[''] after:h-full after:w-[2px] after:absolute after:bg-[#e9c356] after:top-full after:left-0 after:right-0 after:mx-auto relative ${
        //           index === list.length - 1 ? "after:hidden" : ""
        //         } `}>
        //         {index + 1}
        //       </p>
        //       <p>{item?.text}</p>
        //     </li>
        //   ))}
        // </ul>
        <ul className="relative">
          {list.map((item, index) => (
            <li
              key={index}
              className={`relative flex items-start pl-6 pb-5 ${
                index === list.length - 1
                  ? ""
                  : "after:content-[''] after:absolute after:left-[7%] after:top-10 after:w-[2px] after:bg-[#e9c356] after:h-[calc(100%_-_2.5rem)]"
              }`}>
              <div className="w-10 h-10 bg-[#e9c356] text-white flex items-center justify-center rounded-full font-semibold flex-shrink-0">
                {index + 1}
              </div>
              <p className="ml-4">{item?.text}</p>
            </li>
          ))}
        </ul>
      )}

      {extraContent && (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: extraContent }}
        />
      )}
    </div>
  );

  return (
    <section className="py-16 md:py-24" style={sectionStyle}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div
          className={`flex flex-col md:flex-row gap-8 md:gap-12 ${
            imagePosition === "right" ? "md:flex-row-reverse" : ""
          }`}>
          {image?.url && (
            <div className="flex-1 w-full">
              <div className="relative object-cover md:aspect-square w-full rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt || title || "Image"}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </section>
  );
}
