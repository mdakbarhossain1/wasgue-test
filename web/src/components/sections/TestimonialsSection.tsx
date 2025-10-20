"use client";

import Slider from "react-slick";

export default function TestimonialsSection() {
  const testimonials = [
    {
      text: "Heerlijke geuren die lang blijven hangen. De verzending was snel en het product was prachtig verpakt!",
      author: "- Maria K.",
    },
    {
      text: "Eindelijk een wasparfum dat niet te overheersend is. Perfect voor mijn gevoelige huid!",
      author: "- Jan V.",
    },
    {
      text: "Geweldige service en snelle levering. Ik bestel hier zeker weer!",
      author: "- Sophie T.",
    },
  ];

  const settings = {
    dots: false, // hides the pagination dots
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false, // hides navigation arrows
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div className="bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF7EC] py-16">
      <div className="container mx-auto p-4">
        <h2 className="text-3xl font-semibold text-center mb-10 text-gray-800">
          Wat klanten zeggen
        </h2>

        <Slider {...settings}>
          {testimonials.map((testimonial, i) => (
            <div key={i} className="px-3">
              <div className="flex flex-col justify-between bg-[#F4F2EB] p-6 rounded-2xl transition-all duration-300 ease-in-out w-full min-h-[200px]">
                <div>
                  <div className="flex flex-wrap mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 text-[15px] leading-relaxed italic mb-4">
                    "{testimonial.text}"
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-800 text-right">
                  {testimonial.author}
                </p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
