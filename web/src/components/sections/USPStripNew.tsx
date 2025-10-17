"use client";

import { useMediaQuery, breakpoints } from "hooks/useMediaQuery";

// Icon imports
const iconSafeForFabrics = "/figma/Icon-safe for fabrics and machines.svg";
const iconSensitiveSkin = "/figma/Icon-safe for sensitive skin.svg";
const iconEcoFriendly = "/figma/Icon-Eco friendly and parben free.svg";

// USP items data for the new strip
const uspItems = [
  {
    icon: iconSafeForFabrics,
    text: "Safe For All Fabrics & Machines",
  },
  {
    icon: iconSensitiveSkin,
    text: "Formulated For Sensitive Skin",
  },
  {
    icon: iconEcoFriendly,
    text: "Eco Friendly & Paraben Free",
  },
];

export default function USPStripNew() {
  const isMobile = !useMediaQuery(breakpoints.sm);

  return (
    <section
      className="bg-[rgba(214,173,97,0.3)] w-full box-border flex items-center justify-center p-4"
      data-name="USP Strip New"
      data-node-id="49:335"
    >
      {/* Mobile: Horizontal layout with icons next to text */}
      {/* Desktop: Vertical layout with icons above text, centered */}
      <div className="flex w-full justify-center">
        <div
          className={`
          flex 
          ${
            isMobile
              ? "flex-row gap-2 overflow-x-auto justify-start"
              : "flex-row gap-[72px] justify-center"
          }
          items-center
        `}
        >
          {uspItems.map((item, index) => (
            <div
              key={index}
              className={`
                ${isMobile ? "flex-row gap-2" : "flex-col gap-2 w-[260px]"}
                flex items-center shrink-0
              `}
            >
              <div
                className={`relative shrink-0 ${
                  isMobile ? "size-6" : "size-[72px]"
                } overflow-clip`}
              >
                <img alt="" src={item.icon} className="block size-full" />
              </div>
              <div
                className={`
                font-['Helvetica:Regular',_sans-serif] 
                text-[#212529] 
                ${isMobile ? "text-[12px]" : "text-[18px] text-center"}
                leading-[1.5]
              `}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
