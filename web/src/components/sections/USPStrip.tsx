"use client";

import { useMediaQuery, breakpoints } from "hooks/useMediaQuery";

const iconParaben = "/figma/Icon-Parben free.svg";
const iconMicro = "/figma/Icon-Microplastic free.svg";
const iconBio = "/figma/icon-biodegradable.svg";
const iconVegan = "/figma/icon-vegan.svg";

// USP items data for mapping
const uspItems = [
  { icon: iconParaben, text: "No Parabens" },
  { icon: iconMicro, text: "No Micro Plastics" },
  { icon: iconBio, text: "Biodegradable" },
  { icon: iconVegan, text: "100% Vegan" },
];

export default function USPStrip() {
  const isDesktop = useMediaQuery(breakpoints.md);
  const isTablet = useMediaQuery(breakpoints.sm);

  return (
    <section
      className="bg-[#814e1e] w-full box-border flex items-center justify-center py-3 md:py-2.5 px-4"
      data-name="USPs"
      data-node-id="71:5242"
    >
      <div
        className={`
          w-full max-w-[1200px] 
          ${isTablet ? "flex flex-wrap justify-center" : "grid grid-cols-2"}
          ${isDesktop ? "flex flex-nowrap justify-center" : ""} 
          gap-x-4 gap-y-3 md:gap-12
        `}
      >
        {uspItems.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="overflow-clip relative shrink-0 size-8 md:size-10">
              <img alt="" src={item.icon} className="block size-full" />
            </div>
            <span className="text-white text-[14px] md:text-[18px] leading-[1.5] font-[var(--font-helvetica)]">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
