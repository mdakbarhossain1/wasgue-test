"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery, breakpoints } from "hooks/useMediaQuery";

// Import icons
const iconParaben = "/figma/Icon-Parben free.svg";
const iconMicro = "/figma/Icon-Microplastic free.svg";
const iconBio =
  "https://wasgeurtje.nl/wp-content/uploads/2025/03/Icon-Biodegradable-1.svg";
const iconVegan =
  "https://wasgeurtje.nl/wp-content/uploads/2025/03/Icon-100-vegan-1.svg";

// USP items data for the running line
const uspItems = [
  { icon: iconParaben, text: "Geen parabenen" },
  { icon: iconMicro, text: "Geen microplastics" },
  { icon: iconBio, text: "Biologisch afbreekbaar" },
  { icon: iconVegan, text: "100% Veganistisch" },
];

export default function RunningUSPStrip() {
  const isDesktop = useMediaQuery(breakpoints.md);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clone items for seamless scrolling effect
  const itemsRepeated = [...uspItems, ...uspItems, ...uspItems];

  useEffect(() => {
    if (isDesktop || !containerRef.current) return;

    // Animation function for the running line
    const animate = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      if (container.scrollLeft >= container.scrollWidth / 3) {
        // Reset position when we've scrolled through 1/3 of the content
        container.scrollLeft = 0;
      } else {
        // Smooth scroll to create continuous animation
        container.scrollLeft += 1;
      }
    };

    // Set up animation interval
    const animationInterval = setInterval(animate, 30);

    return () => clearInterval(animationInterval);
  }, [isDesktop]);

  // Only show on mobile, hide on desktop
  // if (isDesktop) return null;

  return (
    <>
      {isDesktop ? (
        <section
          className="bg-[#814e1e] w-full box-border overflow-hidden py-3 px-0"
          data-name="Running USP Strip"
          data-node-id="66-3253">
          <div className="flex flex-row items-center justify-center whitespace-nowrap">
            {uspItems.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center mx-4 text-white font-[var(--font-helvetica)]">
                <div className="overflow-clip relative shrink-0 size-5 mr-2">
                  <img alt="" src={item.icon} className="block size-full" />
                </div>
                <p className="text-base font-semibold">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>
      ) : (
        <section
          className="bg-[#814e1e] w-full box-border overflow-hidden py-3 px-0"
          data-name="Running USP Strip"
          data-node-id="66-3253">
          <div
            ref={containerRef}
            className="flex flex-row items-center whitespace-nowrap overflow-x-scroll scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {itemsRepeated.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center mx-4 text-white text-[14px] font-[var(--font-helvetica)]">
                <div className="overflow-clip relative shrink-0 size-6 mr-2">
                  <img alt="" src={item.icon} className="block size-full" />
                </div>
                {item.text}
                <span className="mx-4 text-white">•</span>
              </div>
            ))}
          </div>

          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>
      )}
    </>
  );
}
