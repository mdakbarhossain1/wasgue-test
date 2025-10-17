"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const FooterLayer = () => {
  const pathname = usePathname();

  return <>{pathname === "/checkout" ? null : <Footer />}</>;
};

export default FooterLayer;
