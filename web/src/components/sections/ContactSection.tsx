"use client";

import React from "react";
import ContactForm from "components/forms/ContactForm";

interface ContactSectionProps {
  image?: string;
  googleMap?: string;
  contactFormShortcode?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function ContactSection({
  image,
  googleMap,
  contactFormShortcode,
  backgroundColor = "#ffffff",
  textColor = "#333333",
}: ContactSectionProps) {
  const sectionStyle = {
    backgroundColor,
    color: textColor,
  };

  return (
    <section className="py-12 px-4" style={sectionStyle}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Map Column */}
          {(googleMap || image) && (
            <div className="relative h-[400px] md:h-full">
              {googleMap ? (
                <div
                  className="w-full h-full rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: googleMap }}
                />
              ) : (
                image && (
                  <img
                    src={image}
                    alt="Contact location"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )
              )}
            </div>
          )}

          {/* Contact Form Column */}
          <div className="flex flex-col justify-center">
            {contactFormShortcode && <ContactForm />}
          </div>
        </div>
      </div>
    </section>
  );
}
