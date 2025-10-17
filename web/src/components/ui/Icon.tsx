"use client";

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "size-6" }: IconProps) {
  const iconMap: Record<string, JSX.Element> = {
    "safe-fabrics": (
      <div className="relative size-full">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
          <rect x="10" y="5" width="20" height="15" rx="1" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <rect x="13" y="10" width="6" height="7" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <path d="M25 20C29 20 29 25 25 25H20H15C11 25 11 20 15 20H20H25Z" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <path d="M15 20V10M25 20V10" stroke="#D6AD61" strokeWidth="1.5"/>
          <path d="M13 28L13 33" stroke="#D6AD61" strokeWidth="1.5"/>
          <path d="M27 28L27 33" stroke="#D6AD61" strokeWidth="1.5"/>
          <path d="M13 28C17 28 23 28 27 28" stroke="#D6AD61" strokeWidth="1.5"/>
        </svg>
      </div>
    ),
    "washing-machine": (
      <div className="relative size-full">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
          <rect x="8" y="5" width="24" height="30" rx="2" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="24" r="8" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="24" r="2" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="11" r="2" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <rect x="13" y="8" width="4" height="2" rx="1" stroke="#D6AD61" strokeWidth="1" fill="none"/>
          <rect x="23" y="8" width="4" height="2" rx="1" stroke="#D6AD61" strokeWidth="1" fill="none"/>
        </svg>
      </div>
    ),
    "sensitive-skin": (
      <div className="relative size-full">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
          <path d="M12 10C10 15 15 25 25 20C35 15 25 5 12 10Z" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <path d="M30 15C35 18 30 30 20 25C10 20 25 12 30 15Z" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
          <path d="M15 25C10 30 5 35 8 25C11 15 20 20 15 25Z" stroke="#D6AD61" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
    ),
  };

  return (
    <div className={className}>
      {iconMap[name] || (
        <div className="size-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          {name}
        </div>
      )}
    </div>
  );
}
