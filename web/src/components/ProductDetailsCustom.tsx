import React from "react";
import Testimonials from "./sections/Testimonials";
import Features from "./CustomFeatures";
import Sustainability from "./sections/Sustainability";
import HowItWorks from "./sections/HowItWorks";
import RewardProgram from "./sections/RewardProgram";
import OurStory from "./sections/OurStory";
import ComparisonTable from "./sections/ComparisonTable";
import TrialPackCard from "./sections/TrialPackCard";
import WhatInTheBox from "./sections/WhatInTheBox";
import { Product, RelatedProduct } from "types/product";
import { getProductBySlug } from "utils/woocommerce";
import { notFound } from "next/navigation";
import ProductInfo from "./sections/ProductInfo";

interface ProductDetailsCustomProps {
  product: Product;
  relatedProducts?: RelatedProduct[];
}

const ProductDetailsCustom: React.FC<ProductDetailsCustomProps> = async ({
  product,
  relatedProducts,
}) => {
  // const product = await getProductBySlug(params.slug);
  // fetch product server-side (safe - API keys remain server-side)
  const TrialPackCardsData: Product | null = await getProductBySlug(
    "proefpakket"
  );

  if (!TrialPackCard) {
    notFound();
  }

  console.log(product, "product details custom");

  return (
    <div>
      <ProductInfo productInfo={product} />
      <WhatInTheBox relatedProducts={relatedProducts} />
      {/* accordion */}
      {/* product show case */}
      <HowItWorks />
      {/* Waarom kiezen  */}
      <ComparisonTable />
      <Features />
      {/* <Testimonials /> */}
      {/* <TrialPackCard TrialPackCardsData={TrialPackCardsData} /> */}
      {/* <Sustainability /> */}
      <RewardProgram />
      <OurStory />
    </div>
  );
};

export default ProductDetailsCustom;
