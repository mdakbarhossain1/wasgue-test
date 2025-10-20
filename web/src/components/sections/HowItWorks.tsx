"use client";

import Image from "next/image";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

// Images for the steps
const howItWorksStep1 = "/figma/How it works 1.png";
const howItWorksStep2 = "/figma/How it works 2.png";
const howItWorksStep3 = "/figma/How it works 3.png";
const arrowRight = "/figma/arrow-right.svg";
const lineVertical = "/figma/line-vertical.svg";

// Feature icons (spaties URL-encoded)
const iconSafeFabrics = "/figma/Icon-safe%20for%20all%20fabrics.svg";
const iconWashingMachines = "/figma/Icon-safe%20for%20washing%20machines.svg";
const iconSensitiveSkin = "/figma/Icon-safe%20for%20sensitive%20skin2.svg";

// Reusable components
const StepCard = ({
  image,
  stepNumber,
  title,
  description,
  deviceType,
}: {
  image: string;
  stepNumber: number;
  title: string;
  description: string;
  deviceType: "mobile" | "tablet" | "desktop";
}) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";

  return (
    <div
      className={`content-stretch flex ${
        isMobile
          ? "flex-row gap-4 w-full"
          : isTablet
          ? "flex-col gap-4 w-[220px]"
          : "flex-col gap-6 w-[400px]"
      } md:items-center justify-center`}>
      <div
        className={`rounded-[8px] shrink-0 ${
          isMobile ? "size-[100px]" : isTablet ? "size-[140px]" : "size-[180px]"
        } bg-cover bg-center overflow-hidden`}>
        <Image
          src={image}
          alt={title}
          width={isMobile ? 100 : isTablet ? 140 : 180}
          height={isMobile ? 100 : isTablet ? 140 : 180}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <div
        className={`flex flex-col gap-1 ${
          isMobile ? "items-start" : "items-center"
        } justify-center p-[4px] w-full`}>
        <div
          className={`text-[#814e1e] ${
            isMobile ? "text-left" : "text-center"
          }`}>
          <ol className="list-decimal font-bold list-inside" start={stepNumber}>
            <li className="ml-0">
              <span
                className={`font-['Helvetica'] font-bold ${
                  isMobile
                    ? "text-[16px]"
                    : isTablet
                    ? "text-[17px]"
                    : "text-[18px]"
                } leading-[1.5]`}>
                {title}
              </span>
            </li>
          </ol>
        </div>
        <div className="pl-1.5 w-full">
          <div
            className={`font-['Helvetica'] ${
              isMobile
                ? "text-[14px] text-left"
                : isTablet
                ? "text-[15px] text-center"
                : "text-[16px] text-center"
            } text-[#212529] leading-[1.5]`}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureIcon = ({
  children,
  label,
  deviceType,
}: {
  children: React.ReactNode;
  label: string;
  deviceType: "mobile" | "tablet" | "desktop";
}) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";

  return (
    <div className="flex flex-col gap-2 items-center py-2 text-center">
      <div
        className={
          isMobile
            ? "size-8 flex items-center justify-center"
            : isTablet
            ? "size-9 flex items-center justify-center"
            : "size-10 flex items-center justify-center"
        }
        aria-hidden="true">
        {children}
      </div>
      <div
        className={`font-['Helvetica'] ${
          isMobile ? "text-[12px]" : isTablet ? "text-[14px]" : "text-[16px]"
        } text-[#212529] text-center whitespace-pre leading-[1.5]`}>
        {label}
      </div>
    </div>
  );
};

const ArrowDivider = ({ isTablet = false }: { isTablet?: boolean }) => (
  <div
    className={`flex items-center justify-center ${
      isTablet ? "pb-[90px]" : "pb-[120px]"
    } w-[33px]`}>
    <img
      src={arrowRight}
      alt="Next step"
      className={`${isTablet ? "h-[12px] w-[28px]" : "h-[14.728px] w-[33px]"}`}
    />
  </div>
);

const LineDivider = () => (
  <div className="flex h-0 w-0 items-center justify-center">
    <div className="rotate-[270deg]">
      <div className="relative h-0 w-10">
        <img
          src={lineVertical}
          alt="Divider"
          className="absolute inset-0 top-[-1px]"
        />
      </div>
    </div>
  </div>
);

export default function HowItWorks() {
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return (
    <section
      style={{ backgroundColor: "rgba(214,173,97,0.1)" }}
      className={`${
        isMobile ? "px-4 py-8" : isTablet ? "px-6 py-10" : "p-[72px]"
      } flex flex-col ${
        isTablet ? "gap-6" : "gap-8"
      } items-start justify-start`}
      data-name="How it works">
      <div className="w-full flex flex-col gap-8 items-center justify-center">
        {/* Header */}
        <div className="w-full flex flex-col gap-2 md:gap-4 items-start justify-start">
          <div className="w-full flex gap-2 items-start justify-center">
            <h2
              className={`font-['EB_Garamond'] font-semibold ${
                isMobile
                  ? "text-[24px]"
                  : isTablet
                  ? "text-[28px]"
                  : "text-[32px]"
              } text-[#212529] text-center leading-[1.2]`}>
              Hoe werkt het
            </h2>
          </div>
          <div className="w-full flex gap-2 items-start justify-start">
            <p
              className={`font-['Helvetica'] ${
                isMobile
                  ? "text-[16px]"
                  : isTablet
                  ? "text-[17px]"
                  : "text-[18px]"
              } text-[#212529] text-center leading-[1.5] w-full`}>
              Eenvoudige luxe voor jouw wasgoed
            </p>
          </div>
        </div>

        {/* Features - moved to top, right after header */}
        {/* grid rounded-lg grid-cols-3 gap-4 items-center justify-items-center py-2 */}
        <div className="lg:hidden w-full flex gap-2">
          <div className="w-full flex justify-center relative after:absolute after:h-1/2 after:border-r after:border-[#d6ad614d] after:top-1/2 after:translate-y-[-50%] after:right-0 ">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Veilig voor alle\ntextiel"
                  : "Veilig voor alle textiel"
              }
              deviceType={deviceType}>
              <img
                src={iconSafeFabrics}
                alt="Veilig voor alle textiel"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>

          <div className="w-full flex justify-center relative after:absolute after:h-1/2 after:border-r after:border-[#d6ad614d] after:top-1/2 after:translate-y-[-50%] after:right-0">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Werkt met elke\nwasmachine"
                  : "Werkt met elke wasmachine"
              }
              deviceType={deviceType}>
              <img
                src={iconWashingMachines}
                alt="Werkt met elke wasmachine"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>

          <div className="w-full flex justify-center">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Geformuleerd voor\nde gevoelige huid"
                  : "Geformuleerd voor de gevoelige huid"
              }
              deviceType={deviceType}>
              <img
                src={iconSensitiveSkin}
                alt="Geformuleerd voor de gevoelige huid"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>
        </div>

        {/* Steps */}
        {isMobile || isTablet ? (
          // Mobile layout - vertical stack
          <div className="w-full flex flex-col gap-6 items-start justify-start">
            <StepCard
              image={howItWorksStep1}
              stepNumber={1}
              title="Voeg een vleugje elegantie toe"
              description="Giet een dopje van Wasgeurtje's geconcentreerde wasparfum in het wasverzachtervakje van je wasmachine. Een kleine hoeveelheid is al voldoende voor een heerlijke, langdurige geur."
              deviceType="mobile"
            />

            <StepCard
              image={howItWorksStep2}
              stepNumber={2}
              title="Start je wasprogramma"
              description="Onze formule is geschikt voor alle soorten textiel en wasmachines. Was zoals je gewend bent en geniet van een geur die niet alleen fris blijft, maar ook zacht is voor je kleding."
              deviceType="mobile"
            />

            <StepCard
              image={howItWorksStep3}
              stepNumber={3}
              title="Geniet van langdurige luxe"
              description="Haal je was uit de wasmachine en ervaar een langdurige, luxe geur geïnspireerd door Italiaanse parfums. Jouw kleding blijft fris en heerlijk geurig, wasbeurt na wasbeurt."
              deviceType="mobile"
            />
          </div>
        ) : (
          // Desktop layout - horizontal with arrows
          <div className="w-full flex gap-2 items-center justify-center">
            <StepCard
              image={howItWorksStep1}
              stepNumber={1}
              title="Voeg een vleugje elegantie toe"
              description="Giet een dopje van Wasgeurtje's geconcentreerde wasparfum in het wasverzachtervakje van je wasmachine. Een kleine hoeveelheid is al voldoende voor een heerlijke, langdurige geur."
              deviceType="desktop"
            />

            <ArrowDivider />

            <StepCard
              image={howItWorksStep2}
              stepNumber={2}
              title="Start je wasprogramma"
              description="Onze formule is geschikt voor alle soorten textiel en wasmachines. Was zoals je gewend bent en geniet van een geur die niet alleen fris blijft, maar ook zacht is voor je kleding."
              deviceType="desktop"
            />

            <ArrowDivider />

            <StepCard
              image={howItWorksStep3}
              stepNumber={3}
              title="Geniet van langdurige luxe"
              description="Haal je was uit de wasmachine en ervaar een langdurige, luxe geur geïnspireerd door Italiaanse parfums. Jouw kleding blijft fris en heerlijk geurig, wasbeurt na wasbeurt."
              deviceType="desktop"
            />
          </div>
        )}

        {/* Features - moved to top, right after header */}
        <div className="hidden w-full lg:grid bg-white rounded-lg grid-cols-3 gap-4 items-center justify-items-center px-2 py-2">
          <div className="w-full flex justify-center relative after:absolute after:h-1/2 after:border-r after:border-[#d6ad614d] after:top-1/2 after:translate-y-[-50%] after:right-0 ">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Veilig voor alle\ntextiel"
                  : "Veilig voor alle textiel"
              }
              deviceType={deviceType}>
              <img
                src={iconSafeFabrics}
                alt="Veilig voor alle textiel"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>

          <div className="w-full flex justify-center relative after:absolute after:h-1/2 after:border-r after:border-[#d6ad614d] after:top-1/2 after:translate-y-[-50%] after:right-0 ">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Werkt met elke\nwasmachine"
                  : "Werkt met elke wasmachine"
              }
              deviceType={deviceType}>
              <img
                src={iconWashingMachines}
                alt="Werkt met elke wasmachine"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>

          <div className="w-full flex justify-center">
            <FeatureIcon
              label={
                !isDesktop
                  ? "Geformuleerd voor\nde gevoelige huid"
                  : "Geformuleerd voor de gevoelige huid"
              }
              deviceType={deviceType}>
              <img
                src={iconSensitiveSkin}
                alt="Geformuleerd voor de gevoelige huid"
                className={
                  isMobile ? "size-8" : isTablet ? "size-9" : "size-10"
                }
                loading="lazy"
              />
            </FeatureIcon>
          </div>
        </div>
      </div>
    </section>
  );
}
