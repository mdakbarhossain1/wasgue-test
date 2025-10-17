"use client";
import React from "react";
import { deviceBreakpoints, useMediaQuery } from "hooks/useMediaQuery";
import { useCart } from "context/CartContext";
import Image from "next/image";
import { Product, RelatedProduct } from "types/product";
// Images
const plusIcon = "/figma/plus-icon.svg";
const lineHorizontal = "/figma/line-horizontal.svg";
const tabIndicator = "/figma/tab-indicator.svg";

interface ProductRelatedProps {
  relatedProducts?: RelatedProduct[];
}

const WhatInTheBox: React.FC<ProductRelatedProps> = ({
  relatedProducts = [],
}) => {
  const fallbackProductImage = "/figma/product-flower-rain.png";
  const productsData = [
    {
      id: "273947",
      slug: "white-musk",
      title: "White Musk",
      price: "€15.95",
      image:
        "https://wasgeurtje.nl/wp-content/uploads/2024/01/Sweet-fog-Wasparfum-1.png",
      description:
        "<p>White Musk tot een harmonieus geheel te smeden, hebben we de zijdezachte helderheid van witte muskus verfijnd met transparant hout en een vleugje sandelhout. Een subtiele drup van vanille rondt het af—zacht, modern en feilloos in balans—zodat de bloemige hartnoten elegant worden gedragen zonder te overheersen.</p>\n<p>Het resultaat? Een wasparfum dat je zintuigen streelt tijdens het wassen en daarna nog dagenlang een serene, schone geur achterlaat in je kledingkast. Iedere keer dat je een kledingstuk aantrekt, ontvouwt zich dezelfde kalme luxe: frisse topnoten, een romantisch bloemig hart, en die kenmerkende, omhullende muskus—zoals het gevoel van net gewassen lakens op een zondagochtend, telkens weer.</p>\n",
      scents: ["Citrus", "Muskus", "Vanille", "Roos"],
      stock_status: "instock",
      stock_quantity: null,
      categories: ["Ontdek de Magie van Luxe Wasparfum" as any], // Replace 'as any' with the correct ProductCategory type if available
    },
  ];

  const { addToCart } = useCart();
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);
  const ProductCard = ({ product }: { product: Product }) => {
    const productUrl = `/wasparfum/${product.slug}`;
    // URL voor het product, bijvoorbeeld: /wasparfum/[product-slug]

    // Consistent height based on device type
    // const cardHeight = isMobile
    //   ? "h-[380px]"
    //   : isTablet
    //   ? "h-[420px]"
    //   : "h-[460px]";

    return (
      <div
        className={`bg-white relative rounded-[4px] w-full h-full border border-[#d6ad61] overflow-hidden`}>
        <div className="content-stretch flex flex-col gap-2 items-start justify-between h-full">
          {/* Product Image - Klikbaar */}
          <a href={productUrl} className="block w-full">
            <div
              className={`content-stretch flex ${
                isMobile ? "h-[140px]" : isTablet ? "h-[170px]" : "h-[200px]"
              } items-center justify-center overflow-clip w-full cursor-pointer`}>
              <div
                className={`bg-center bg-contain bg-no-repeat ${
                  isMobile ? "h-[140px]" : isTablet ? "h-[170px]" : "h-[200px]"
                } w-full`}>
                <Image
                  src={product?.image || fallbackProductImage}
                  alt={product?.title}
                  width={isMobile ? 160 : isTablet ? 200 : 240}
                  height={isMobile ? 140 : isTablet ? 170 : 200}
                  className="w-full h-full object-contain"
                  priority
                  onError={(e) => {
                    // Fall back to local image if remote image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src !== fallbackProductImage) {
                      target.src = fallbackProductImage;
                    }
                  }}
                />
              </div>
            </div>
          </a>

          <div className="content-stretch flex flex-col gap-4 items-start justify-between w-full flex-1">
            <div className="content-stretch flex flex-col gap-2 items-start justify-start w-full flex-1">
              <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-3 py-0 w-full flex-1">
                {/* Product Title - Klikbaar */}
                <a href={productUrl} className="block w-full">
                  <div className="content-stretch flex flex-col items-center justify-start cursor-pointer">
                    <div
                      className={`text-[#814e1e] ${
                        isMobile
                          ? "text-[15px]"
                          : isTablet
                          ? "text-[16px]"
                          : "text-[18px]"
                      } leading-[1.5] font-['Helvetica'] text-center hover:underline`}>
                      {product.title}
                    </div>
                  </div>
                </a>

                <div className="h-[1px] w-full relative">
                  <img
                    src={lineHorizontal}
                    alt=""
                    className="block size-full"
                  />
                </div>

                {/* Product Description */}
                {product.description && (
                  <div
                    className={`font-['Helvetica'] ${
                      isMobile
                        ? "text-[12px] line-clamp-3"
                        : isTablet
                        ? "text-[13px] line-clamp-3"
                        : "text-[14px] line-clamp-4"
                    } text-[rgba(33,37,41,0.9)] leading-[1.5] overflow-hidden hidden md:block`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}

                <div
                  className={`font-['Helvetica'] italic ${
                    isMobile
                      ? "text-[12px]"
                      : isTablet
                      ? "text-[13px]"
                      : "text-[14px]"
                  } text-[rgba(33,37,41,0.8)] leading-[1.5] hidden md:block`}>
                  Parfum profiel
                </div>

                <div className="content-stretch gap-1 items-start justify-start flex-wrap hidden sm:flex">
                  {(product.scents || []).map((scent, index) => (
                    <div
                      key={`${product.id}-scent-${index}`}
                      className={`bg-[rgba(214,173,97,0.1)] border border-[rgba(214,173,97,0.3)] rounded-[20px] ${
                        isMobile
                          ? "px-2 py-0"
                          : isTablet
                          ? "px-3 py-0.5"
                          : "px-4 py-0.5"
                      }`}>
                      <div
                        className={`font-['Helvetica'] ${
                          isMobile
                            ? "text-[12px]"
                            : isTablet
                            ? "text-[13px]"
                            : "text-[14px]"
                        } text-[#814e1e] leading-[1.5] whitespace-pre`}>
                        {scent}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="box-border content-stretch flex gap-2 items-center justify-between bg-[rgba(214,173,97,0.3)] px-3 py-2 w-full rounded-b-[4px] mt-auto">
                <div
                  className={`font-['Helvetica'] text-[#212529] ${
                    isMobile
                      ? "text-[14px]"
                      : isTablet
                      ? "text-[15px]"
                      : "text-[16px]"
                  } leading-[1.5] font-medium`}>
                  {product.price}
                </div>

                <button
                  className={`bg-[#fcce4e] flex gap-2 items-center justify-center p-1 rounded-[2px] ${
                    isMobile ? "size-6" : isTablet ? "size-6.5" : "size-7"
                  } hover:bg-[#d6ad61] transition-colors`}
                  onClick={(e) => {
                    e.preventDefault(); // Voorkom dat de klik doorgegeven wordt aan de container
                    addToCart({
                      id: product.id,
                      title: product.title,
                      price: parseFloat(
                        (product.price || "0")
                          .toString()
                          .replace("€", "")
                          .replace(",", ".")
                      ),
                      image: product.image || fallbackProductImage,
                    });
                  }}>
                  <img
                    src={plusIcon}
                    alt="Add to cart"
                    className="h-3 w-[11px]"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="px-4 py-3 max-w-7xl mx-auto sm:px-6 lg:px-8 my-12 bg-white rounded-md p-6 md:p-12 lg:p-20">
      <div className="my-6">
        <h2 className="font-['EB_Garamond'] font-semibold text-[40px] text-[#814e1e] text-center leading-[1.2] w-full">
          Wat zit er in de doos?
        </h2>
        <p className="font-['Helvetica'] text-[#212529] text-[18px] text-center leading-[1.5]">
          Vijf signatuurgeuren, één luxe ervaring
        </p>
      </div>
      <div className="mt-3">
        <div
          className={`content-stretch ${
            isMobile || isTablet ? "grid grid-cols-2" : "grid grid-cols-4"
          } ${isTablet ? "gap-4" : "gap-2"} items-stretch w-full`}>
          {relatedProducts?.map((product) => (
            <div key={product.id} className="w-full">
              {/* <ProductCard product={product} /> */}
              <div
                className={`bg-white relative rounded-[4px] w-full h-full border border-[#d6ad61] overflow-hidden`}>
                <div className="content-stretch flex flex-col gap-2 items-start justify-between h-full">
                  {/* Product Image - Klikbaar */}
                  <a
                    href={`/wasparfum/${product.slug}`}
                    className="block w-full">
                    <div
                      className={`content-stretch flex ${
                        isMobile
                          ? "h-[140px]"
                          : isTablet
                          ? "h-[170px]"
                          : "h-[200px]"
                      } items-center justify-center overflow-clip w-full cursor-pointer`}>
                      <div
                        className={`bg-center bg-contain bg-no-repeat ${
                          isMobile
                            ? "h-[140px]"
                            : isTablet
                            ? "h-[170px]"
                            : "h-[200px]"
                        } w-full`}>
                        <Image
                          src={product?.image || fallbackProductImage}
                          alt={product?.title}
                          width={isMobile ? 160 : isTablet ? 200 : 240}
                          height={isMobile ? 140 : isTablet ? 170 : 200}
                          className="w-full h-full object-contain"
                          priority
                          onError={(e) => {
                            // Fall back to local image if remote image fails to load
                            const target = e.target as HTMLImageElement;
                            if (target.src !== fallbackProductImage) {
                              target.src = fallbackProductImage;
                            }
                          }}
                        />
                      </div>
                    </div>
                  </a>

                  <div className="content-stretch flex flex-col gap-4 items-start justify-between w-full flex-1">
                    <div className="content-stretch flex flex-col gap-2 items-start justify-start w-full flex-1">
                      <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-3 py-0 w-full flex-1">
                        {/* Product Title - Klikbaar */}
                        <a
                          href={`/wasparfum/${product.slug}`}
                          className="block w-full">
                          <div className="content-stretch flex flex-col items-center justify-start cursor-pointer">
                            <div
                              className={`text-[#814e1e] ${
                                isMobile
                                  ? "text-[15px]"
                                  : isTablet
                                  ? "text-[16px]"
                                  : "text-[18px]"
                              } leading-[1.5] font-['Helvetica'] text-center hover:underline`}>
                              {product.title}
                            </div>
                          </div>
                        </a>

                        <div className="h-[1px] w-full relative">
                          <img
                            src={lineHorizontal}
                            alt=""
                            className="block size-full"
                          />
                        </div>

                        {/* Product Description */}
                        {product?.description && (
                          <div
                            className={`font-['Helvetica'] ${
                              isMobile
                                ? "text-[12px] line-clamp-3"
                                : isTablet
                                ? "text-[13px] line-clamp-3"
                                : "text-[14px] line-clamp-4"
                            } text-[rgba(33,37,41,0.9)] leading-[1.5] overflow-hidden hidden md:block`}
                            dangerouslySetInnerHTML={{
                              __html: product.description,
                            }}
                          />
                        )}

                        <div
                          className={`font-['Helvetica'] italic ${
                            isMobile
                              ? "text-[12px]"
                              : isTablet
                              ? "text-[13px]"
                              : "text-[14px]"
                          } text-[rgba(33,37,41,0.8)] leading-[1.5] hidden md:block`}>
                          Parfum profiel
                        </div>

                        <div className="content-stretch gap-1 items-start justify-start flex-wrap hidden sm:flex">
                          {(product?.scents || []).map((scent, index) => (
                            <div
                              key={`${product.id}-scent-${index}`}
                              className={`bg-[rgba(214,173,97,0.1)] border border-[rgba(214,173,97,0.3)] rounded-[20px] ${
                                isMobile
                                  ? "px-2 py-0"
                                  : isTablet
                                  ? "px-3 py-0.5"
                                  : "px-4 py-0.5"
                              }`}>
                              <div
                                className={`font-['Helvetica'] ${
                                  isMobile
                                    ? "text-[12px]"
                                    : isTablet
                                    ? "text-[13px]"
                                    : "text-[14px]"
                                } text-[#814e1e] leading-[1.5] whitespace-pre`}>
                                {scent}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="box-border content-stretch flex gap-2 items-center justify-between bg-[rgba(214,173,97,0.3)] px-3 py-2 w-full rounded-b-[4px] mt-auto">
                        <div
                          className={`font-['Helvetica'] text-[#212529] ${
                            isMobile
                              ? "text-[14px]"
                              : isTablet
                              ? "text-[15px]"
                              : "text-[16px]"
                          } leading-[1.5] font-medium`}>
                          {product.price}
                        </div>

                        <button
                          className={`bg-[#fcce4e] flex gap-2 items-center justify-center p-1 rounded-[2px] ${
                            isMobile
                              ? "size-6"
                              : isTablet
                              ? "size-6.5"
                              : "size-7"
                          } hover:bg-[#d6ad61] transition-colors`}
                          onClick={(e) => {
                            e.preventDefault(); // Voorkom dat de klik doorgegeven wordt aan de container
                            addToCart({
                              id: product.id,
                              title: product.title,
                              price: parseFloat(
                                (product.price || "0")
                                  .toString()
                                  .replace("€", "")
                                  .replace(",", ".")
                              ),
                              image: product.image || fallbackProductImage,
                            });
                          }}>
                          <img
                            src={plusIcon}
                            alt="Add to cart"
                            className="h-3 w-[11px]"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatInTheBox;
