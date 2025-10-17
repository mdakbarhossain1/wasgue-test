"use client";

import React from "react";

interface TextBoxProps {
  title?: string;
  content?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  boxShadow?: string;
  alignment?: "left" | "center" | "right";
  boxes: any;
}

export default function TextBox({
  title,
  content,
  boxes,
  backgroundColor = "#ffffff",
  textColor = "#333333",
  borderColor = "#e5e5e5",
  borderWidth = 1,
  borderRadius = 8,
  padding = "2rem",
  boxShadow = "0 2px 4px rgba(0,0,0,0.1)",
  alignment = "left",
}: TextBoxProps) {
  const boxStyle = {
    backgroundColor,
    color: textColor,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    padding,
    boxShadow,
    textAlign: alignment,
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div style={title || content ? boxStyle : undefined} className="">
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
          )}

          {content && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {boxes && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {boxes?.map((items: any, index: any) => (
                <React.Fragment key={index}>
                  <li
                    className={`${
                      items.title === "Verzending" && "bg-[#e9c356]"
                    } text-black max-w-4xl w-full p-8 border border-[#e9c356]`}>
                    <p className="text-center">
                      <span
                        className={`${
                          items.title === "Verzending"
                            ? "border-b-4 border-b-white"
                            : "border-b-4 border-b-[#e9c356]"
                        } text-4xl inline-flex pb-3 mb-2`}>
                        {items.title}
                      </span>
                    </p>
                    <p className="text-xl font-light text-center">
                      {items.content}
                    </p>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
