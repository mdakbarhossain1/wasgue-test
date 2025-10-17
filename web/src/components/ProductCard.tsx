"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "types/product";

export default function ProductCard({ product }: { product: Product }) {
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== "/figma/product-flower-rain.png") {
      target.src = "/figma/product-flower-rain.png";
    }
  };

  return (
    <Link href={`/wasparfum/${product.slug}`} className="group">
      <div className="bg-white border border-[#d6ad61] rounded-[4px] overflow-hidden">
        <div className="relative h-[200px] bg-white flex items-center justify-center p-4">
          <Image
            src={product.image}
            alt={product.title}
            width={160}
            height={200}
            className="object-contain h-full w-auto transition-transform group-hover:scale-105"
            onError={handleImageError}
          />
        </div>
        <div className="p-4">
          <h2 className="text-center text-[#814e1e] text-base font-medium leading-[1.5] font-['Helvetica']">
            {product.title}
          </h2>
          <p className="mt-2 text-center font-bold text-[#212529]">
            {product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}
