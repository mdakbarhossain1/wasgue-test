"use client";

import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";

const imgMorningVapor = "/figma/morning-vapor.png";
const imgImage283 = "/figma/categories-image-283.png";
const imgImage = "/figma/categories-trial.png";
const imgImage1 = "/figma/categories-gift.png";

export default function Categories() {
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.lg);

  const categories = [
    {
      name: "Best Verkocht",
      url: "/wasparfum",
      imageComponent: (
        <div className="h-full w-full overflow-clip relative rounded-[8px]">
          {/* Gold gradient background from tile */}
          <div
            className="absolute inset-0 rounded-[8px]"
            style={{
              background:
                "linear-gradient(180deg, #FCCE4E 0%, #D6AD61 60%, #C6994A 100%)",
            }}
          />
          {/* Bottle PNG centered without rectangular card; uses drop-shadow on alpha */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={imgMorningVapor}
              alt=""
              className={`w-auto ${
                isTablet ? "h-[120px]" : isDesktop ? "h-[220px]" : "h-[100px]"
              }`}
              style={{ filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.25))" }}
            />
          </div>
        </div>
      ),
    },
    {
      name: "Premium Wasparfums",
      url: "/wasparfum/#fancy_product--section",
      imageComponent: (
        <div className="h-full w-full overflow-clip relative rounded-[8px]">
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('${imgImage283}')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        </div>
      ),
    },
    {
      name: "Proefpakket",
      url: "/wasparfum/proefpakket/",
      imageComponent: (
        <div className="h-full w-full overflow-clip relative rounded-[8px]">
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('${imgImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        </div>
      ),
    },
    {
      name: "Cadeauset",
      url: "/wasparfum/cadeauset-wasparfum/",
      imageComponent: (
        <div className="h-full w-full overflow-clip relative rounded-[8px]">
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('${imgImage1}')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <section
      className={`bg-white box-border content-stretch flex flex-col gap-8 items-center justify-start ${
        isTablet ? "py-12 px-6" : isDesktop ? "p-[72px]" : "py-10 px-4"
      } relative w-full`}
      data-name="Categories"
      data-node-id="71:5058"
    >
      {/* Grid container that changes from 4 columns to 2 columns to 1 column based on screen size */}
      <div
        className={`grid ${
          isTablet
            ? "grid-cols-2 gap-6"
            : isDesktop
            ? "grid-cols-4 gap-8"
            : "grid-cols-2 gap-4"
        } w-full`}
        data-node-id="71:5059"
      >
        {categories.map((category, index) => (
          <div
            key={index}
            className={`flex ${
              isTablet
                ? "gap-3 flex-col-reverse"
                : isDesktop
                ? "gap-4  flex-col"
                : "gap-2 flex-col-reverse"
            } items-center justify-center`}
            data-name={category.name}
            data-node-id={`71:${5066 + index * 4}`}
          >
            <a
              href={category.url}
              className={`overflow-hidden relative rounded-[8px] w-full ${
                isTablet ? "h-[144px]" : isDesktop ? "h-[280px]" : "h-[120px]"
              } cursor-pointer block`}
              data-name="Product images"
              data-node-id={`71:${5068 + index * 4}`}
            >
              {category.imageComponent}
            </a>
            <a
              href={category.url}
              className={`font-[var(--font-eb-garamond)] font-semibold leading-[0] text-[#212529] ${
                isTablet
                  ? "text-[20px]"
                  : isDesktop
                  ? "text-[24px]"
                  : "text-[18px]"
              } text-center block cursor-pointer`}
              data-node-id={`71:${5067 + index * 4}`}
            >
              <p className="leading-[1.2] text-base">{category.name}</p>
            </a>
          </div>
        ))}
      </div>

      <a
        href="/wasparfum"
        className={`bg-gradient-to-l from-[#d6ad61] to-[#fcce4e] box-border content-stretch flex h-11 items-center justify-center px-8 py-0 relative rounded-[4px] ${
          isTablet ? "mt-5" : isDesktop ? "mt-4" : "mt-6"
        }`}
        data-name="CTA"
        data-node-id="71:5083"
      >
        <span
          className={`text-center leading-[1.5] uppercase text-[#212529] font-[var(--font-helvetica)] ${
            isTablet ? "text-[16px]" : "text-[16px]"
          }`}
        >
          Alle wasparfums bekijken
        </span>
      </a>
    </section>
  );
}
