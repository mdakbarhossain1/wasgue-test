"use client";

import { useMediaQuery, breakpoints } from "hooks/useMediaQuery";

type AnnouncementBarProps = {
  message?: string;
  className?: string;
  mobileMessage?: string;
};

export default function AnnouncementBar({
  message = "Order Before 4pm For Same Day Shipping",
  mobileMessage = "Same Day Shipping",
  className = "",
}: AnnouncementBarProps) {
  const isDesktop = useMediaQuery(breakpoints.md);

  return (
    <div className={`w-full bg-[#282725] fixed top-0 left-0 right-0 z-[60]`}>
      <div
        className={`container-px mx-auto flex items-center justify-center py-2 ${className}`}
      >
        <p className="t4 text-white text-center">
          {isDesktop ? message : mobileMessage}
        </p>
      </div>
    </div>
  );
}
