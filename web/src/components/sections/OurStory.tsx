"use client";

import React from "react";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

import storyBg from "/public/figma/our-story-bg.svg";

export default function OurStory() {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  return (
    <section
      className={`relative flex flex-col story-bg items-center justify-center  ${
        isMobile
          ? "pt-10 pb-20 px-4"
          : isTablet
          ? "pt-12 pb-20 px-6"
          : "pt-[72px] pb-[100px] px-10"
      } w-full`}
    >
      <div
        className={`flex flex-col max-w-[1100px] mx-auto ${
          isMobile ? "gap-4" : isTablet ? "gap-5" : "gap-6"
        } items-center justify-center w-full`}
      >
        <div
          className={`flex flex-col gap-4 items-center justify-center w-full`}
        >
          {isMobile ? (
            // Mobile layout - left aligned text with logo in top right
            <div className="flex flex-col gap-6 w-full relative">
              {/* Logo positioned in top right */}
              <div className="absolute top-0 right-0 w-[125px] h-[90px]">
                <img
                  src="/figma/wasgeurtje-logo-gold.png"
                  alt="Wasgeurtje Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://wasgeurtje.nl/wp-content/uploads/2022/01/wasgeurtje-logo.png";
                  }}
                />
              </div>

              {/* Vector line 1 */}
              <div className="absolute top-[80px] left-0 right-0">
                <img src="/figma/vector1.svg" alt="" className="w-full" />
              </div>

              {/* Mobile heading */}
              <h3 className="font-['Helvetica'] text-[18px] text-white leading-[1.5]">
                Ons verhaal
              </h3>

              {/* Mobile title and text */}
              <div className="flex flex-col gap-4 w-full text-white">
                <h2 className="font-['EB_Garamond'] font-semibold text-[28px] leading-[1.2]">
                  Geboren uit passie, <br></br>
                  gemaakt voor luxe
                </h2>
                <p className="font-['Helvetica'] text-[16px] leading-[1.5]">
                  We begonnen Wasgeurtje.nl in 2020 met een eenvoudige missie:
                  van de was een luxe ritueel maken, terwijl we trouw blijven
                  aan onze liefde voor duurzaamheid. Gefrustreerd door de
                  kortdurende, chemisch zware geuren in traditionele producten,
                  zijn we op zoek gegaan naar milieuvriendelijke, parabeenvrije
                  wasparfums die een langdurige, verfijnde geur geven bij elke
                  wasbeurt.
                </p>
              </div>

              {/* Vector line 2 */}
              <div className="absolute bottom-0 left-0 right-0">
                <img src="/figma/vector2.svg" alt="" className="w-full" />
              </div>
            </div>
          ) : isTablet ? (
            // Tablet layout - similar to mobile but with adjusted sizes
            <div className="flex flex-col gap-6 w-full relative">
              {/* Logo positioned in top right */}
              <div className="absolute top-0 right-0 w-[150px] h-[110px]">
                <img
                  src="/figma/wasgeurtje-logo-gold.png"
                  alt="Wasgeurtje Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://wasgeurtje.nl/wp-content/uploads/2022/01/wasgeurtje-logo.png";
                  }}
                />
              </div>

              {/* Vector line 1 */}
              <div className="absolute top-[90px] left-0 right-0">
                <img src="/figma/vector1.svg" alt="" className="w-full" />
              </div>

              {/* Tablet heading */}
              <h3 className="font-['Helvetica'] text-[18px] text-white leading-[1.5]">
                Ons verhaal
              </h3>

              {/* Tablet title and text */}
              <div className="flex flex-col gap-4 w-full text-white">
                <h2 className="font-['EB_Garamond'] font-semibold text-[30px] leading-[1.2]">
                  Geboren uit passie, <br></br>
                  gemaakt voor luxe
                </h2>
                <p className="font-['Helvetica'] text-[17px] leading-[1.5] max-w-[600px]">
                  We begonnen Wasgeurtje.nl in 2020 met een eenvoudige missie:
                  van de was een luxe ritueel maken, terwijl we trouw blijven
                  aan onze liefde voor duurzaamheid. Gefrustreerd door de
                  kortdurende, chemisch zware geuren in traditionele producten,
                  zijn we op zoek gegaan naar milieuvriendelijke, parabeenvrije
                  wasparfums die een langdurige, verfijnde geur geven bij elke
                  wasbeurt.
                </p>
              </div>

              {/* Vector line 2 */}
              <div className="absolute bottom-0 left-0 right-0">
                <img src="/figma/vector2.svg" alt="" className="w-full" />
              </div>
            </div>
          ) : (
            // Desktop layout - two columns
            <div className="flex gap-2 items-center justify-between w-full">
              {/* Text content */}
              <div className="flex flex-col gap-2 grow items-start justify-center">
                <h3 className="font-['Helvetica'] text-[18px] text-white leading-[1.5] w-full">
                  Ons verhaal
                </h3>
                <div className="flex flex-col gap-4 items-start justify-start w-full text-white">
                  <h2 className="font-['EB_Garamond'] font-semibold text-[32px] leading-[1.2]">
                    Geboren uit passie, gemaakt voor luxe
                  </h2>
                  <p className="font-['Helvetica'] text-[16px] leading-[1.5] w-[663px]">
                    We begonnen Wasgeurtje.nl in 2020 met een eenvoudige missie:
                    van de was een luxe ritueel maken, terwijl we trouw blijven
                    aan onze liefde voor duurzaamheid. Gefrustreerd door de
                    kortdurende, chemisch zware geuren in traditionele
                    producten, zijn we op zoek gegaan naar milieuvriendelijke,
                    parabeenvrije wasparfums die een langdurige, verfijnde geur
                    geven bij elke wasbeurt.
                  </p>
                </div>
              </div>

              {/* Logo */}
              <div className="w-[235px] h-[187px] shrink-0 flex items-center justify-center">
                <img
                  src="/figma/wasgeurtje-logo-gold.png"
                  alt="Wasgeurtje Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://wasgeurtje.nl/wp-content/uploads/2022/01/wasgeurtje-logo.png";
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
