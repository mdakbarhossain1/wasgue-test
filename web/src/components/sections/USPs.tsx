"use client";

import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

// Icon assets for USP section
const iconFabric = "/figma/Icon-safe for fabrics and machines.svg";
const iconSkin = "/figma/Icon-safe for sensitive skin.svg";
const iconEco = "/figma/Icon-Eco friendly and parben free.svg";

// USP item data for mapping
const uspItems = [
  {
    icon: iconFabric,
    alt: "Veilig voor alle stoffen en machines",
    text: "Veilig voor alle stoffen",
    nodeId: "71:4943",
  },
  {
    icon: iconSkin,
    alt: "Werkt met elke wasmachine",
    text: "Werkt met elke wasmachine",
    nodeId: "71:4946",
  },
  {
    icon: iconEco,
    alt: "Geformuleerd voor de gevoelige huid",
    text: "Geformuleerd voor de gevoelige huid",
    nodeId: "71:4949",
  },
];

export default function USPs() {
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.lg);

  return (
    <section
      className={`${
        isDesktop ? "carve-bg " : "bg-[#f4f1ec]"
      }  box-border relative w-full py-6 lg:pt-28 lg:pb-10 px-4 lg:mt-[-160px]`}
      data-name="USPs"
      data-node-id="71:4941"
    >
      <div
        className={`flex flex-row items-center ${
          isTablet
            ? "justify-center gap-8 max-w-[640px]"
            : isDesktop
            ? "justify-center max-w-[800px] gap-[40px]"
            : "justify-between w-full max-w-[380px]"
        } mx-auto`}
      >
        {uspItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center w-full">
            <div
              className={`content-stretch flex flex-col ${
                isTablet ? "gap-2" : isDesktop ? "gap-2" : "gap-1"
              } h-full items-center justify-center relative shrink-0 flex-1 ${
                isTablet ? "w-[200px]" : isDesktop ? "w-[220px]" : ""
              }`}
              data-name="Frame"
              data-node-id={`71:${4942 + index * 3}`}
            >
              <div
                className={`relative shrink-0 flex items-center justify-center ${
                  isTablet
                    ? "size-[60px]"
                    : isDesktop
                    ? "size-[64px]"
                    : "size-[48px]"
                } mb-2`}
                data-name={`Icon-${item.alt}`}
                data-node-id={item.nodeId}
              >
                <img
                  alt={item.alt}
                  className="block max-w-none size-full"
                  src={item.icon}
                />
              </div>
              <div
                className={`flex flex-col font-['Helvetica:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#212529] ${
                  isTablet
                    ? "text-[16px]"
                    : isDesktop
                    ? "text-[18px]"
                    : "text-[15px]"
                } text-center`}
                data-node-id={`71:${4944 + index * 3}`}
              >
                <p
                  className={`${
                    isTablet || isDesktop ? "leading-[1.5]" : "leading-[1.3]"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
