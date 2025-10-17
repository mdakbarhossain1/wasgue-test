import Image from "next/image";

interface TextContentProps {
  title?: string;
  content: string;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlay?: boolean;
  alignment?: "left" | "center" | "right";
  maxWidth?: string;
  padding?: string;
}

export default function TextContent({
  title,
  content,
  backgroundColor = "#FFFFFF",
  textColor = "#333333",
  backgroundImage,
  minHeight,
  overlay = false,
  alignment = "left",
  maxWidth = "4xl",
  padding = "py-16",
}: TextContentProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor,
    minHeight: minHeight ? `${minHeight}px` : undefined,
    position: backgroundImage ? "relative" : undefined,
  };

  return (
    <section className={`${padding} relative`} style={sectionStyle}>
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority={false}
          />
          {overlay && (
            <div
              className="absolute inset-0 bg-black opacity-50"
              style={{ backgroundColor: backgroundColor, opacity: 0.7 }}
            />
          )}
        </div>
      )}

      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className={`max-w-${maxWidth} ${alignmentClasses[alignment]}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl mb-2 text-center text-black">
                {/* style={{ color: title && textColor }} */}
                {title}
              </h2>
            )}

            {/* Animated Underline */}
            <div className="flex items-center justify-center gap-2  mb-8">
              <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-[#e9c356] animate-pulse"></div>
              <div className="w-2 h-2 bg-[#e9c356] rounded-full animate-ping"></div>
              <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-[#e9c356] animate-pulse"></div>
            </div>
            <div
              className="prose prose-lg max-w-none text-center custom-prose"
              style={{ color: textColor }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
