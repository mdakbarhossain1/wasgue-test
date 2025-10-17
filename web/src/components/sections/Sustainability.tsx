"use client";

import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

// Sustainability feature data
interface SustainabilityFeature {
  icon: string;
  title: string;
  alt: string;
}

const sustainabilityFeatures: SustainabilityFeature[] = [
  {
    icon: "/figma/icon-no-parabens.svg",
    title: "Geen parabenen of microplastics",
    alt: "Geen parabenen of microplastics icoon",
  },
  {
    icon: "/figma/icon-biodegradable.svg",
    title: "Biologisch afbreekbare ingrediënten",
    alt: "Biologisch afbreekbare ingrediënten icoon",
  },
  {
    icon: "/figma/icon-vegan.svg",
    title: "100% Veganistisch & Dierproefvrij",
    alt: "Veganistisch en dierproefvrij icoon",
  },
  {
    icon: "/figma/icon-recycled.svg",
    title: "Flessen van gerecycled plastic",
    alt: "Gerecycled plastic icoon",
  },
];

// Feature card component
const FeatureCard = ({
  feature,
  deviceType,
}: {
  feature: SustainabilityFeature;
  deviceType: "mobile" | "tablet" | "desktop";
}) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";

  return (
    <div
      className={`content-stretch flex flex-col ${
        isMobile ? "gap-2 h-[140px]" : isTablet ? "gap-2 h-[150px]" : "gap-3"
      } items-center justify-start ${isMobile || isTablet ? "w-full" : "w-60"}`}
    >
      <div
        className={`bg-white overflow-hidden relative rounded-[50px] shrink-0 ${
          isMobile ? "size-[60px]" : isTablet ? "size-[66px]" : "size-[72px]"
        } flex items-center justify-center`}
      >
        <img
          src={feature.icon}
          alt={feature.alt}
          className={`${
            isMobile
              ? "w-[60px] h-[60px]"
              : isTablet
              ? "w-[66px] h-[66px]"
              : "w-[72px] h-[72px]"
          } object-contain`}
        />
      </div>
      <div
        className={`font-['Helvetica'] text-[#212529] ${
          isMobile ? "text-[16px]" : isTablet ? "text-[17px]" : "text-[18px]"
        } text-center leading-[1.5] ${
          isMobile || isTablet ? "w-full" : "w-[155px]"
        }`}
      >
        {feature.title}
      </div>
    </div>
  );
};

export default function Sustainability() {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return (
    <section
      className={`bg-[rgba(214,173,97,0.3)] ${
        isMobile ? "px-4 py-10" : isTablet ? "px-6 py-10" : "p-[72px]"
      } flex flex-col ${
        isMobile || isTablet ? "gap-8" : "gap-12"
      } items-center justify-start w-full`}
      data-name="Sustainably Scented, Consciously Crafted"
    >
      {/* Heading and subheading */}
      <div className="flex flex-col gap-4 items-start justify-start w-full">
        <h2
          className={`font-['EB_Garamond'] font-semibold ${
            isMobile ? "text-[28px]" : isTablet ? "text-[32px]" : "text-[40px]"
          } text-[#814e1e] text-center leading-[1.2] w-full`}
        >
          Duurzaam geparfumeerd, bewust gemaakt
        </h2>
        <div className="w-full flex justify-center">
          <p
            className={`font-['Helvetica'] text-[#212529] ${
              isMobile
                ? "text-[16px]"
                : isTablet
                ? "text-[17px]"
                : "text-[18px]"
            } text-center leading-[1.5]`}
          >
            Veilig voor je huid, je kleding en de planeet
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div
        className={`${
          isMobile || isTablet ? "grid grid-cols-2" : "flex flex-wrap"
        } items-start justify-center ${
          isMobile ? "gap-6" : isTablet ? "gap-8" : "gap-6"
        } w-full`}
      >
        {sustainabilityFeatures.map((feature, index) => (
          <FeatureCard key={index} feature={feature} deviceType={deviceType} />
        ))}
      </div>
    </section>
  );
}
