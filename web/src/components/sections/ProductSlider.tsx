"use client";

import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type ProductSliderProps = {
  productInfo: {
    image: string;
    images?: string[];
  };
};

const ProductSlider: React.FC<ProductSliderProps> = ({ productInfo }) => {
  const sliderFor = useRef<Slider>(null);
  const sliderNav = useRef<Slider>(null);

  const [nav1, setNav1] = useState<Slider | null>(null);
  const [nav2, setNav2] = useState<Slider | null>(null);

  useEffect(() => {
    setNav1(sliderFor.current);
    setNav2(sliderNav.current);
  }, []);

  const settingsFor = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
    asNavFor: nav2 as Slider | undefined,
  };

  const settingsNav = {
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: sliderFor.current ?? undefined,
    dots: false,
    centerMode: false, // keep this off unless you want true centering
    focusOnSelect: true,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3, // slight fraction to avoid weird gaps
        },
      },
    ],
  };

  return (
    <div className="product-slider">
      {/* Main image slider */}
      <Slider {...settingsFor} ref={sliderFor}>
        {productInfo.images?.map((img, index) => (
          <div key={index}>
            <img
              src={img}
              alt={`image-${index}`}
              style={{
                width: "100%",
                borderRadius: "12px",
                objectFit: "contain",
              }}
            />
          </div>
        ))}
      </Slider>

      {/* Thumbnail slider */}
      <div className="slideNav-wrapper" style={{ marginTop: "12px" }}>
        <Slider {...settingsNav} ref={sliderNav}>
          {productInfo.images?.map((img, index) => (
            <div className="sliderNavs" key={index}>
              <img
                src={img}
                alt={`thumbnail-${index}`}
                className="thumbnail-img"
              />
            </div>
          ))}
        </Slider>
      </div>

      <style jsx>{`
        .slideNav-wrapper {
          padding: 0 8px;
        }

        .thumbnail-img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid transparent;
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .thumbnail-img:hover {
          transform: scale(1.05);
        }

        /* Highlight the active thumbnail */
        :global(.slick-current .thumbnail-img) {
          transform: scale(1.05);
          border-color: #000;
        }

        @media (max-width: 1024px) {
          .thumbnail-img {
            height: 90px;
          }
        }

        @media (max-width: 768px) {
          .thumbnail-img {
            height: 80px;
          }
        }

        @media (max-width: 480px) {
          .thumbnail-img {
            height: 65px;
            border-radius: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductSlider;
