"use client";

import { useRef, useState, useEffect } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

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
    slidesToShow: 4, // default for desktop
    slidesToScroll: 1,
    asNavFor: sliderFor.current ?? undefined,
    dots: false,
    centerMode: true,
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 768, // when screen width < 768px
        settings: {
          slidesToShow: 3, // show 3 items on mobile
        },
      },
    ],
  };

  return (
    <div>
      <Slider {...settingsFor} ref={sliderFor}>
        {productInfo.images?.map((img, index) => (
          <div key={index}>
            <img
              src={img}
              alt={`thumbnail-${index}`}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </div>
        ))}
      </Slider>

      <div className="slideNav-wrapper">
        <Slider {...settingsNav} ref={sliderNav}>
          {/* Thumbnail images */}
          {productInfo.images?.map((img, index) => (
            <div className="sliderNavs" key={index}>
              <img
                src={img}
                alt={`thumbnail-${index}`}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default ProductSlider;
