import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import "./product-typography.css";
// import FigmaHeader from "@/components/sections/FigmaHeader";
// import ResponsiveInit from "@/components/ResponsiveInit";
// import { CartProvider } from "@/context/CartContext";
// import { AuthProvider } from "@/context/AuthContext";
// import CartSidebar from "@/components/CartSidebar";
// import Footer from "@/components/sections/Footer";
import FigmaHeader from "components/sections/FigmaHeader";
import ResponsiveInit from "components/ResponsiveInit";
import { CartProvider } from "context/CartContext";
import { AuthProvider } from "context/AuthContext";
import CartSidebar from "components/CartSidebar";
import FooterLayer from "components/sections/FooterLayer";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-eb-garamond",
});

export const metadata: Metadata = {
  title: "Wasgeurtje.nl — Luxe Wasparfums",
  description:
    "Luxe wasparfums met Italiaans geïnspireerde geuren gemaakt met premium essentiële oliën.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${ebGaramond.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <ResponsiveInit />
            <FigmaHeader />
            {children}
            <FooterLayer />
            <CartSidebar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
