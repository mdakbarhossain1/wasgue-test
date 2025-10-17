"use client";

import { useState } from "react";
import {
  useMediaQuery,
  breakpoints,
  deviceBreakpoints,
} from "hooks/useMediaQuery";
import { useCart } from "context/CartContext";
import { useAuth } from "context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function FigmaHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { openCart, cartCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const isSmallMobile = useMediaQuery(deviceBreakpoints.smallMobile);
  const isMobile = useMediaQuery(deviceBreakpoints.mobile);
  const isIpadMini = useMediaQuery(deviceBreakpoints.ipadMini);
  const isTablet = useMediaQuery(deviceBreakpoints.tablet);
  const isDesktop = useMediaQuery(deviceBreakpoints.desktop);

  return (
    <>
      {/* Main Header */}
      <div
        className="bg-black w-full fixed top-0 left-0 right-0 z-50"
        data-name="Background"
        data-node-id="71:4777"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-[86px]">
            {/* Mobile hamburger menu button - Left side */}
            <div className="flex lg:hidden mr-4">
              <button
                className="flex items-center justify-center p-2 rounded-md text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  width={isMobile ? "29" : "24"}
                  height={isMobile ? "29" : "24"}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6H20M4 12H20M4 18H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Logo - Left positioned */}
            <div className="flex flex-col items-center">
              <Link href="/" className="flex flex-col items-center">
                <Image
                  src="/figma/header/logo.png"
                  alt="Wasgeurtje Logo"
                  width={173}
                  height={34}
                  className={`w-auto ${isMobile ? "h-[50px]" : "h-14"}`} // Larger for better text readability
                />
              </Link>
            </div>

            {/* Desktop navigation - Centered between logo and account */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8 flex-1 justify-center">
              <Link
                href="/blogs"
                className="text-white uppercase text-sm font-medium"
              >
                BLOGS
              </Link>
              <Link
                href="/wasparfum"
                className="text-white uppercase text-sm font-medium"
              >
                WASPARFUM
              </Link>
              <Link
                href="/wasparfum/proefpakket"
                className="text-white uppercase text-sm font-medium"
              >
                WASPARFUM PROEFPakket
              </Link>
              <Link
                href="/contact"
                className="text-white uppercase text-sm font-medium"
              >
                CONTACT
              </Link>
            </div>

            {/* Account and cart icons - Right side */}
            <div className="flex items-center space-x-4">
              {/* Account dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="text-white flex items-center space-x-2"
                >
                  {isLoggedIn && user?.avatar ? (
                    <div className="relative">
                      <Image
                        src={user.avatar}
                        alt="Profile"
                        width={isMobile ? 26 : 22}
                        height={isMobile ? 26 : 22}
                        className={`${
                          isMobile ? "w-[29px] h-[29px]" : "w-6 h-6"
                        } rounded-full object-cover border-2 border-[#D6AD61]`}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-black"></div>
                    </div>
                  ) : (
                    <Image
                      src="/figma/header/user-icon.svg"
                      alt="Account"
                      width={isMobile ? 26 : 22}
                      height={isMobile ? 26 : 22}
                      className={isMobile ? "w-[29px] h-[29px]" : "w-6 h-6"}
                    />
                  )}
                  {isLoggedIn && !isMobile && (
                    <span className="text-sm font-medium hidden lg:block text-white">
                      {user?.firstName || "Account"}
                    </span>
                  )}
                </button>

                {/* Account dropdown menu */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {isLoggedIn ? (
                      <>
                        {/* User info header */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            {user?.avatar && (
                              <Image
                                src={user.avatar}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-[#814E1E]">
                                {user?.displayName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-2">
                          <Link
                            href="/account"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-[#814E1E]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Mijn Account
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-[#814E1E]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"
                              />
                            </svg>
                            Mijn Bestellingen
                          </Link>
                          <Link
                            href="/account/profile"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-[#814E1E]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Instellingen
                          </Link>
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                logout();
                                setAccountMenuOpen(false);
                              }}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              Uitloggen
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Not logged in menu */}
                        <div className="py-2">
                          <Link
                            href="/auth/login"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-[#814E1E]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            Inloggen
                          </Link>
                          <Link
                            href="/auth/register"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-[#814E1E]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                            Account Aanmaken
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button onClick={openCart} className="relative text-white">
                <Image
                  src="/figma/header/cart-icon.svg"
                  alt="Cart"
                  width={isMobile ? 26 : 22}
                  height={isMobile ? 26 : 22}
                  className={isMobile ? "w-[29px] h-[29px]" : "w-6 h-6"}
                />
                {cartCount > 0 && (
                  <span
                    className={`absolute ${
                      isMobile ? "-top-2.5 -right-2.5" : "-top-2 -right-2"
                    } bg-[#FCCE4E] text-black text-xs font-bold rounded-full ${
                      isMobile ? "w-6 h-6" : "w-5 h-5"
                    } flex items-center justify-center`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="bg-black w-full py-4 px-6 flex flex-col gap-6 z-50 lg:hidden fixed top-[86px] left-0 right-0">
          <Link
            href="/blogs"
            className="text-white uppercase text-center py-3 border-b border-white/20"
          >
            BLOGS
          </Link>
          <Link
            href="/wasparfum"
            className="text-white uppercase text-center py-3 border-b border-white/20"
          >
            WASPARFUM
          </Link>
          <Link
            href="/wasparfum/proefpakket"
            className="text-white uppercase text-center py-3 border-b border-white/20"
          >
            WASPARFUM PROEFPAKKET
          </Link>
          <Link
            href="/contact"
            className="text-white uppercase text-center py-3"
          >
            CONTACT
          </Link>
        </div>
      )}
    </>
  );
}
