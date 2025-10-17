"use client";

// Testimonials section for the landing page
// Displays customer reviews using TrustIndex widget

import { useEffect, useRef } from "react";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

export default function Testimonials() {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  return (
    <section
      className={`bg-[rgba(252,206,78,0.3)] ${
        isTablet ? "py-10 px-6" : isDesktop ? "py-12 px-[76px]" : "py-8 px-4"
      } flex flex-col items-center ${
        isTablet ? "gap-5" : "gap-6"
      } relative z-10`}
      data-name="Testimonials"
      id="testimonials-section">
      {/* Section heading for mobile */}
      {isMobile && (
        <h2 className="text-[24px] font-[var(--font-eb-garamond)] text-center mb-2">
          What Our Customers Say
        </h2>
      )}

      {/* TrustIndex widget container - using iframe for better isolation */}
      <div
        className={`w-full testimonial-iframe ${
          isTablet
            ? "max-w-[700px]"
            : isDesktop
            ? "max-w-[1800px]"
            : "max-w-[100%]"
        } flex justify-center`}>
        <iframe
          src="https://cdn.trustindex.io/amp-widget.html#502ce9a39f5d731f95560046340"
          title="Customer Reviews"
          style={{
            width: "100%",
            height: isTablet ? "320px" : "350px",
            border: "none",
            position: "relative",
            zIndex: 20,
            backgroundColor: "transparent",
            overflow: "hidden",
          }}
        />
      </div>
    </section>
  );
}
