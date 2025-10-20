"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery, deviceBreakpoints } from "hooks/useMediaQuery";

// Interface for footer links
interface FooterLink {
  label: string;
  url: string;
}

// Footer column data
interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Footer columns data
const footerColumns: FooterColumn[] = [
  {
    title: "Ontdekken",
    links: [
      {
        label: "Doseren i-Dos wasmachine",
        url: "/wasparfum-doseren-idos-wasmachine",
      },
      { label: "Wasparfum proefpakket", url: "/wasparfum/proefpakket" },
      { label: "Wasparfum cadeauset", url: "/wasparfum/cadeauset-wasparfum" },
      { label: "Wasparfum", url: "/wasparfum" },
    ],
  },
  {
    title: "Informatie",
    links: [
      { label: "Onze groene missie", url: "/groene-missie" },
      { label: "Ons verhaal", url: "/ons-verhaal" },
      { label: "Verkooppunten", url: "/verkooppunten" },
      { label: "Verkooppunt worden", url: "/retail" },
      { label: "Algemene voorwaarden", url: "/algemene-voorwaarden" },
      { label: "Waarom Wasgeurtje?", url: "/waarom-wasgeurtje" },
      { label: "waspunten", url: "/waspunten" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Contact", url: "/contact" },
      { label: "Veelgestelde vragen", url: "/veel-gestelde-vragen" },
      { label: "Betaalmogelijkheden", url: "/betaalmogelijkheden" },
      { label: "Verzenden en retourneren", url: "/verzenden-retourneren" },
      { label: "Wasgeurtje Kruidvat", url: "/wasparfum-kruidvat" },
      { label: "Wasgeurtje aanbieding", url: "/wasparfum-aanbieding" },
    ],
  },
  {
    title: "Contact",
    links: [],
  },
];

// Social media links
const socialLinks = [
  {
    icon: "/figma/social/facebook-f.svg",
    url: "https://www.facebook.com/wasgeurtje/",
    alt: "Facebook",
  },
  {
    icon: "/figma/social/twitter-x.svg",
    url: "https://twitter.com/wasgeurtje/",
    alt: "Twitter/X",
  },
  {
    icon: "/figma/social/instagram.svg",
    url: "https://www.instagram.com/wasgeurtje/",
    alt: "Instagram",
  },
  {
    icon: "/figma/social/youtube.svg",
    url: "https://www.youtube.com/channel/UCaXzmARtM-ugr90z2AMG-nw/",
    alt: "YouTube",
  },
];

// Footer link component
const FooterLink = ({
  link,
  isTablet = false,
}: {
  link: FooterLink;
  isTablet?: boolean;
}) => (
  <li
    className={`mb-4 ${isTablet ? "text-left" : "text-center md:text-left"}`}>
    <Link
      href={link.url}
      className="text-[#c9c9c9] hover:text-white text-[15px] font-['Jost'] leading-[1.5]">
      {link.label}
    </Link>
  </li>
);

// Footer column component
const FooterColumn = ({
  column,
  isTablet = false,
}: {
  column: FooterColumn;
  isTablet?: boolean;
}) => (
  <div className="w-full md:w-auto">
    <h3
      className={`text-white font-['Jost'] text-[19px] mb-4 relative pb-2 leading-[1.2] ${
        isTablet ? "text-left" : "text-center md:text-left"
      }`}>
      {column.title}
      <div
        className={`absolute bottom-0 ${
          isTablet
            ? "left-[20px] transform -translate-x-1/2"
            : "left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0"
        } h-0.5 w-[39px] bg-[#e9c356]`}></div>
    </h3>
    <ul className="space-y-1">
      {column.links.map((link, index) => (
        <FooterLink key={index} link={link} isTablet={isTablet} />
      ))}
    </ul>
  </div>
);

// Social icon component
const SocialIcon = ({
  icon,
  url,
  alt,
}: {
  icon: string;
  url: string;
  alt: string;
}) => (
  <a
    href={url}
    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#c3862c] to-[#fcce4e] text-white"
    aria-label={alt}>
    <div className="h-4 w-4 flex items-center justify-center">
      <img src={icon} alt={alt} className="h-4 w-4" />
    </div>
  </a>
);

export default function Footer() {
  const [email, setEmail] = useState<string>("");
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <footer className="bg-[#1d1d1d] text-white w-full relative z-0">
      {/* Newsletter signup */}
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row md:justify-between items-start md:items-center gap-5">
          <div
            className={`${
              isTablet ? "max-w-[500px]" : "max-w-[720px]"
            } mb-0 sm:mb-6 `}>
            <h2
              className={`${
                isTablet ? "text-[24px]" : "text-[22px] md:text-[26px]"
              } mb-2 leading-[1.2] text-white font-semibold`}>
              Blijf op de hoogte van onze geurige wereld!
            </h2>
            <p className="footer-newsletter-text">
              Schrijf je in voor onze nieuwsbrief en ontvang maandelijks
              exclusieve kortingen en updates over onze nieuwste wasgeurtjes!
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className={`flex ${
              isTablet ? "sm:flex-row" : "md:flex-row"
            } gap-2 w-full ${isTablet ? "sm:w-auto" : "md:w-auto"}`}>
            <input
              type="email"
              placeholder="Voer uw e-mailadres in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`px-4 py-3 w-full ${
                isTablet ? "sm:w-[360px]" : "md:w-[300px]"
              } rounded-[4px] border border-[#c6c6c6] bg-transparent text-white focus:outline-none focus:border-[#e9c356]`}
              required
            />
            <button
              type="submit"
              className="px-4 py-3 font-medium text-white bg-gradient-to-l from-[#d6ad61] to-[#fcce4e] rounded-[4px] hover:opacity-90 transition-opacity">
              AANMELDEN
            </button>
          </form>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-[rgba(118,118,118,0.7)] mx-auto"></div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div
          className={`flex flex-col ${
            isTablet ? "sm:flex-col" : "md:flex-row"
          } justify-between`}>
          {/* Logo column */}
          <div
            className={`mb-8 ${
              isTablet ? "mb-8 sm:mr-8" : "md:mb-0 md:mr-12"
            } flex justify-center ${
              isTablet ? "sm:justify-start" : "md:justify-start"
            }`}>
            <div
              className={`w-[180px] ${
                isTablet ? "sm:w-[200px]" : "md:w-[223px]"
              } h-[180px] ${
                isTablet ? "sm:h-[200px]" : "md:h-[223px]"
              } relative flex items-center justify-center`}>
              <img
                src="/figma/footer-logo.png"
                alt="Wasgeurtje Logo"
                width={310}
                height={310}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          </div>

          {/* Main footer links in columns */}
          <div
            className={`flex-1 grid grid-cols-1 ${
              isTablet
                ? "sm:grid-cols-2"
                : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            } gap-y-8 gap-x-4 ${isTablet ? "sm:gap-x-5" : "md:gap-x-6"}`}>
            {/* Footer columns */}
            {footerColumns.slice(0, 3).map((column, index) => (
              <div key={index} className="col-span-1">
                <FooterColumn column={column} isTablet={isTablet} />
              </div>
            ))}

            {/* Contact column */}
            <div className="col-span-1">
              <h3
                className={`text-white font-['Jost'] text-[19px] mb-4 relative pb-2 leading-[1.2] ${
                  isTablet ? "text-left" : "text-center md:text-left"
                }`}>
                {footerColumns[3].title}
                <div
                  className={`absolute bottom-0 ${
                    isTablet
                      ? "left-[20px] transform -translate-x-1/2"
                      : "left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0"
                  } h-0.5 w-[39px] bg-[#e9c356]`}></div>
              </h3>

              {/* Email */}
              <div
                className={`flex flex-wrap flex-col ${
                  isTablet ? "sm:flex-row justify-start" : "md:flex-row"
                } items-center ${
                  isTablet ? "sm:items-start" : "md:items-start"
                } gap-3 mb-4`}>
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#c3862c] to-[#fcce4e]">
                  <img
                    src="/figma/social/envelope-fill.svg"
                    alt="Email"
                    className="w-4 h-4"
                  />
                </div>
                <div
                  className={`${
                    isTablet
                      ? "text-center sm:text-left"
                      : "text-center md:text-left"
                  }`}>
                  <p className="text-[#c9c9c9] font-['Jost'] text-[16px]">
                    Email
                  </p>
                  <a
                    href="mailto:info@wasgeurtje.nl"
                    className="text-[#c9c9c9] font-['Jost'] text-[16px] hover:text-white">
                    info@wasgeurtje.nl
                  </a>
                </div>
              </div>

              {/* Social icons */}
              <div
                className={`flex flex-wrap ${
                  isTablet
                    ? "justify-center sm:justify-start"
                    : "justify-center md:justify-start"
                } gap-2 mt-6`}>
                {socialLinks.map((social, index) => (
                  <SocialIcon key={index} {...social} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment and shipping */}
        <div className={`mt-8 ${isTablet ? "sm:mt-10" : "md:mt-12"}`}>
          <div
            className={`flex flex-col sm:justify-start lg:justify-start ${
              isTablet ? "sm:flex-row" : "md:flex-row"
            } gap-8 ${isTablet ? "sm:gap-12" : "md:gap-16"}`}>
            <div
              className={`flex flex-col items-center ${
                isTablet ? "sm:items-start" : "md:items-start"
              }`}>
              <h4 className="text-white font-['Jost'] text-[16px] mb-4">
                Betaalmethodes
              </h4>
              <img
                src="/figma/payment-methods.png"
                alt="Payment Methods"
                width={238}
                height={28}
                className="max-h-7"
              />
            </div>
            <div
              className={`flex flex-col items-center ${
                isTablet ? "sm:items-start" : "md:items-start"
              }`}>
              <h4 className="text-white font-['Jost'] text-[16px] mb-4">
                Verzendmethodes
              </h4>
              <img
                src="/figma/shipping-methods.png"
                alt="Shipping Methods"
                width={96}
                height={28}
                className="max-h-7"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="container mx-auto px-4 py-4 border-t border-[rgba(118,118,118,0.3)]">
        <div
          className={`flex flex-col ${
            isTablet ? "sm:flex-row" : "md:flex-row"
          } justify-between items-center`}>
          <p
            className={`text-[#c9c9c9] font-['Jost'] text-[14px] ${
              isTablet ? "sm:text-[15px]" : "md:text-[16px]"
            } mb-4 ${isTablet ? "sm:mb-0" : "md:mb-0"} text-center ${
              isTablet ? "sm:text-left" : "md:text-left"
            }`}>
            Alle rechten voorbehouden © {new Date().getFullYear()} Wasgeurtje
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy-policy"
              className={`text-[#c9c9c9] font-['Jost'] ${
                isTablet ? "text-[14px]" : "text-[14px]"
              } hover:text-white`}>
              Privacybeleid
            </Link>
            <Link
              href="/algemene-voorwaarden"
              className={`text-[#c9c9c9] font-['Jost'] ${
                isTablet ? "text-[14px]" : "text-[14px]"
              } hover:text-white`}>
              Algemene voorwaarden
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
