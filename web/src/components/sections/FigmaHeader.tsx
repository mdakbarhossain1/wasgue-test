"use client";

import { useState, useEffect, useRef } from "react";
import { useMediaQuery, deviceBreakpoints } from "hooks/useMediaQuery";
import { useCart } from "context/CartContext";
import { useAuth } from "context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function FigmaHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { openCart, cartCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  const isMobile = useMediaQuery(deviceBreakpoints.mobile);

  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // --- Outside click detection for both menus ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close account dropdown if clicked outside
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }

      // Close mobile menu if clicked outside (excluding toggle button)
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !mobileMenuButtonRef.current?.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Automatically close menus when any link is clicked ---
  const handleLinkClick = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-black w-full fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-[86px]">
            {/* Mobile hamburger */}
            <div className="flex lg:hidden md:mr-4">
              <button
                ref={mobileMenuButtonRef}
                className="flex items-center justify-center p-2 rounded-md text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}>
                <svg
                  width={isMobile ? "29" : "24"}
                  height={isMobile ? "29" : "24"}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
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

            {/* Logo */}
            <Link
              href="/"
              className="flex flex-col items-center"
              onClick={handleLinkClick}>
              <img
                src="/figma/header/logo.png"
                alt="Wasgeurtje Logo"
                className={`w-auto ${
                  isMobile ? "!w-[180px] md:h-[50px]" : "h-14"
                }`}
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8 flex-1 justify-center">
              <Link
                href="/blogs"
                onClick={handleLinkClick}
                className="text-white uppercase text-sm font-medium">
                BLOGS
              </Link>
              <Link
                href="/wasparfum"
                onClick={handleLinkClick}
                className="text-white uppercase text-sm font-medium">
                WASPARFUM
              </Link>
              <Link
                href="/wasparfum/proefpakket"
                onClick={handleLinkClick}
                className="text-white uppercase text-sm font-medium">
                WASPARFUM PROEFPakket
              </Link>
              <Link
                href="/contact"
                onClick={handleLinkClick}
                className="text-white uppercase text-sm font-medium">
                CONTACT
              </Link>
            </div>

            {/* Account + cart */}
            <div className="flex items-center space-x-4 shrink-0">
              {/* Account dropdown */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="text-white flex items-center space-x-2">
                  {isLoggedIn && user?.avatar ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className={`${
                          isMobile ? "w-[29px] h-[29px]" : "w-6 h-6"
                        } rounded-full object-cover border-2 border-[#D6AD61]`}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-black" />
                    </div>
                  ) : (
                    <Image
                      src="/figma/header/user-icon.svg"
                      alt="Account"
                      width={isMobile ? 26 : 26}
                      height={isMobile ? 26 : 26}
                      className={isMobile ? "w-[29px] h-[29px]" : "w-6 h-6"}
                    />
                  )}
                  {isLoggedIn && !isMobile && (
                    <span className="text-sm font-medium hidden lg:block text-white">
                      {user?.firstName || "Account"}
                    </span>
                  )}
                </button>

                {/* Dropdown content */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {isLoggedIn ? (
                      <>
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

                        <div className="py-2">
                          <Link
                            href="/account"
                            onClick={handleLinkClick}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors">
                            Mijn Account
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={handleLinkClick}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors">
                            Mijn Bestellingen
                          </Link>
                          <Link
                            href="/account/profile"
                            onClick={handleLinkClick}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0] transition-colors">
                            Instellingen
                          </Link>
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                logout();
                                handleLinkClick();
                              }}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              Uitloggen
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <Link
                          href="/auth/login"
                          onClick={handleLinkClick}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0]">
                          Inloggen
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={handleLinkClick}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#FFF9F0]">
                          Account Aanmaken
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
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
                    } flex items-center justify-center`}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="bg-black w-full py-4 px-6 flex flex-col z-50 lg:hidden fixed top-[86px] left-0 right-0">
          <Link
            href="/blogs"
            onClick={handleLinkClick}
            className="text-white uppercase text-center py-3 border-b border-white/20">
            BLOGS
          </Link>
          <Link
            href="/wasparfum"
            onClick={handleLinkClick}
            className="text-white uppercase text-center py-3 border-b border-white/20">
            WASPARFUM
          </Link>
          <Link
            href="/wasparfum/proefpakket"
            onClick={handleLinkClick}
            className="text-white uppercase text-center py-3 border-b border-white/20">
            WASPARFUM PROEFPAKKET
          </Link>
          <Link
            href="/contact"
            onClick={handleLinkClick}
            className="text-white uppercase text-center py-3">
            CONTACT
          </Link>
        </div>
      )}
    </>
  );
}
