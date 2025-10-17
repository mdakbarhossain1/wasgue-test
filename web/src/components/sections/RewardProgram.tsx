"use client";
import React from "react";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

// Reward program feature interface
interface RewardFeature {
  title: string;
  description: string;
}

// Reward program features data
const rewardFeatures: RewardFeature[] = [
  {
    title: "Meld je aan en begin met verdienen:",
    description: "Geen extra stappen nodig",
  },
  {
    title: "Verzamel punten bij elke aankoop:",
    description: "Word beloond voor elke euro die je uitgeeft",
  },
  {
    title: "Inwisselen voor exclusieve kortingen:",
    description:
      "Gebruik uw punten bij het afrekenen voor gratis flessen en exclusieve besparingen",
  },
  {
    title: "Ontgrendel exclusieve kortingen:",
    description:
      "Ontgrendel speciale beloningen en verrassingen naarmate u opklimt in onze loyaliteitsniveaus",
  },
];

// Feature card component
const FeatureCard = ({
  feature,
  deviceType,
}: {
  feature: RewardFeature;
  deviceType: "mobile" | "tablet" | "desktop";
}) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";

  return (
    <div
      className={`bg-[rgba(214,173,97,0.3)] flex gap-4 items-center ${
        isMobile ? "px-4 py-3" : isTablet ? "px-5 py-3" : "px-6 py-3"
      } rounded-[4px] ${
        isMobile
          ? "h-auto min-h-[80px]"
          : isTablet
          ? "h-auto min-h-[90px]"
          : "h-[105px]"
      } w-full`}
    >
      <div className="shrink-0 size-6">
        <img
          src="/figma/checkmark-icon.svg"
          alt="Checkmark"
          className="size-6"
        />
      </div>
      <div className="flex flex-col justify-center text-[#212529]">
        <p
          className={`font-['Helvetica'] font-bold ${
            isMobile ? "text-[16px]" : isTablet ? "text-[17px]" : "text-[18px]"
          } leading-[1.5] mb-0`}
        >
          {feature.title}
        </p>
        <p
          className={`font-['Helvetica'] ${
            isMobile ? "text-[16px]" : isTablet ? "text-[17px]" : "text-[18px]"
          } leading-[1.5]`}
        >
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export default function RewardProgram() {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return (
    <section
      className={`bg-[rgba(252,206,78,0.3)] ${
        isMobile ? "px-4 py-10" : isTablet ? "px-6 py-10" : "px-[72px] py-0"
      } flex flex-col gap-4 items-start justify-center w-full`}
    >
      <div
        className={`flex flex-col max-w-[660px] mx-auto gap-8 items-center justify-center ${
          isMobile
            ? "px-0 py-0"
            : isTablet
            ? "px-4 py-4"
            : "px-5 pt-16 pb-[72px] "
        } w-full`}
      >
        {/* Header with icon and text */}
        <div
          className={`flex ${
            isMobile || isTablet ? "flex-row-reverse" : "flex-col"
          } ${
            isMobile ? "gap-6" : isTablet ? "gap-6 " : "gap-[23px] "
          } items-center  w-full justify-between lg:justify-center`}
        >
          <div
            className={`${
              isMobile
                ? "h-[80px] w-[101px]"
                : isTablet
                ? "h-[90px] w-[113px]"
                : "h-[100px] w-[126.582px]"
            } relative shrink-0`}
          >
            <img
              src="/figma/reward-icon.svg"
              alt="Reward Program"
              className="size-full"
            />
          </div>

          <div
            className={`flex flex-col gap-4 items-center  ${
              isMobile || isTablet
                ? "flex-1 max-w-[180px]"
                : "w-full justify-center"
            }`}
          >
            <h2
              className={`font-['EB_Garamond'] font-semibold ${
                isMobile
                  ? "text-[28px]"
                  : isTablet
                  ? "text-[32px]"
                  : "text-[40px]"
              } text-[#814e1e] leading-[1.2] lg:text-center w-full`}
            >
              Beloon uw Liefde voor de was
            </h2>
            <p
              className={`font-['Helvetica'] ${
                isMobile
                  ? "text-[16px]"
                  : isTablet
                  ? "text-[17px]"
                  : "text-[18px]"
              } text-[#212529] leading-[1.5] lg:text-center w-full`}
            >
              Wasgeurtje spaarprogramma
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="flex flex-col gap-2 items-start justify-start w-full">
          {isMobile || isTablet ? (
            // Mobile & Tablet: All cards in a single column
            <div className="flex flex-col gap-2 items-start justify-center w-full">
              {rewardFeatures.map((feature, index) => (
                <FeatureCard
                  key={index}
                  feature={feature}
                  deviceType={deviceType}
                />
              ))}
            </div>
          ) : (
            // Desktop: 2x2 grid layout
            <>
              <div className="flex flex-col gap-2 items-start justify-center w-full">
                {rewardFeatures.slice(0, 2).map((feature, index) => (
                  <FeatureCard
                    key={index}
                    feature={feature}
                    deviceType={deviceType}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2 items-start justify-center w-full">
                {rewardFeatures.slice(2, 4).map((feature, index) => (
                  <FeatureCard
                    key={index}
                    feature={feature}
                    deviceType={deviceType}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
