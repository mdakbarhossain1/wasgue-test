'use client';

import React, { useState } from 'react';

export default function ShippingNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#e9c356] text-[#1d1d1d] py-3 px-4 relative">
      <div className="container mx-auto text-center">
        <p className="text-sm font-medium">
          📦 <strong>Belangrijke melding: tijdelijk geen gratis verzending</strong>{' '}
          Vanwege aanhoudende vertragingen bij PostNL bieden we op dit moment uitsluitend Track & Trace verzending aan. 
          Gratis verzending is tijdelijk niet beschikbaar totdat het bezorgprobleem bij PostNL is opgelost. 
          Met Track & Trace kun je jouw bestelling eenvoudig volgen en heb je sneller zekerheid over de levering. 
          Dank voor je begrip en geduld ♥️
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1d1d1d] hover:text-[#1d1d1d]/70 transition-colors"
          aria-label="Negeren"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
