"use client";

import { useMediaQuery, breakpoints } from "hooks/useMediaQuery";
import Link from "next/link";

const imgImage287 = "/figma/hero-image-287.png";
const imgImage288 = "/figma/Mobile-Background-2.webp";
const imgStar = "/figma/star.svg";

export default function HeroSection() {
  const isDesktop = useMediaQuery(breakpoints.lg);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: isDesktop ? "772px" : "auto" }}
      data-name="Hero section"
      data-node-id="71:4862">
      {/* Main container with columns (flex on desktop, stack on mobile) */}
      <div className={`${isDesktop ? "flex" : "flex flex-col"} h-full`}>
        {/* Column with gold gradient background */}
        <div
          className={`relative ${isDesktop ? "w-[47%]" : "w-full"} ${
            isDesktop ? "h-full" : "h-[450px]"
          }`}>
          {/* Gold gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(252,206,78,0.95) 0%, rgba(214,173,97,0.92) 45%, rgba(198,153,74,0.9) 100%)",
            }}
          />

          {/* Content column aligned to left */}
          <div
            className={`absolute left-0 top-0 w-full h-full box-border flex flex-col gap-6 items-start justify-start ${
              isDesktop ? "pt-20 px-[72px]" : "pt-10 px-6"
            } pb-0 z-10`}>
            <div className=" mx-auto md:mx-[unset] relative shrink-0 h-6 bg-white rounded-[20px] px-6 py-0 box-border flex items-center gap-2">
              <div className="relative shrink-0 flex items-start gap-[5.5px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="relative shrink-0 size-[18px]">
                    <img
                      alt=""
                      className="block max-w-none size-full"
                      src={imgStar}
                    />
                  </div>
                ))}
              </div>
              <div className="relative shrink-0 text-[#212529] md:text-[16px] text-[14px] leading-[0] not-italic text-center">
                <p className="leading-[1.5] whitespace-pre">1400+ reviews</p>
              </div>
            </div>

            <div
              className={`relative shrink-0  text-[#212529] font-semibold ${
                isDesktop ? "text-[56px]" : "text-[24px] text-center"
              } leading-[0]`}>
              <h1 className="leading-[1.2] md:text-4xl font-[var(--font-eb-garamond)]">
                Luxe wasparfums die uitzonderlijk lang blijven hangen
              </h1>
            </div>

            <div
              className={`relative shrink-0  text-[#212529] ${
                isDesktop ? "text-[24px]" : "text-[16px] text-center"
              } leading-[0] not-italic`}>
              <p className="leading-[1.5] md:text-xl">
                Italiaans geïnspireerde geuren gemaakt met eersteklas essentiële
                oliën
              </p>
            </div>

            <Link
              href="/wasparfum"
              className="relative hidden lg:inline-flex  flex-shrink-0 bg-black text-white uppercase rounded-[4px] h-11  items-center justify-center px-14">
              <span className="text-[16px] leading-[1.5]">Ontdek nu</span>
            </Link>
          </div>
        </div>

        {/* Column with image */}
        <div
          className={`relative ${
            isDesktop
              ? "flex-1"
              : "w-full min-h-[400px] sm:min-h-[550px] md:min-h-[750px] mt-[-200px]"
          }`}>
          <div
            className="absolute inset-0 bg-no-repeat lg:block hidden"
            style={{
              backgroundImage: `url('${imgImage287}')`,
              backgroundSize: "cover",
              backgroundPosition: "right bottom",
            }}
          />
          <div
            className="absolute inset-0 bg-no-repeat  lg:hidden flex items-end justify-center"
            style={{
              backgroundImage: `url('${imgImage288}')`,
              backgroundSize: "cover",
              backgroundPosition: "top",
            }}>
            <Link
              href="/wasparfum"
              className="  inline-flex  flex-shrink-0 bg-black text-white uppercase rounded-[4px] h-11  items-center justify-center px-14 mb-10">
              <span className="text-[16px] leading-[1.5]">Ontdek nu</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
