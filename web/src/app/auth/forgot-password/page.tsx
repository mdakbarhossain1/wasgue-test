"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "context/AuthContext";
import Footer from "components/sections/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { forgotPassword } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "E-mailadres is verplicht";
    }
    if (!emailRegex.test(email)) {
      return "Voer een geldig e-mailadres in";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(
          result.message || "Er is een fout opgetreden. Probeer het opnieuw."
        );
      }
    } catch (err: any) {
      setError(
        "Er is een fout opgetreden. Controleer je internetverbinding en probeer het opnieuw."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
          <div className="flex-grow flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  E-mail verzonden
                </h2>
                <p className="text-gray-600 mb-6">
                  Als er een account bestaat met dit e-mailadres, hebben we een
                  wachtwoord reset link verzonden.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2C5530] hover:bg-[#1e3a21] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C5530] transition-colors">
                    Terug naar inloggen
                  </Link>
                  <p className="text-sm text-gray-600">
                    Geen e-mail ontvangen?{" "}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="font-medium text-[#2C5530] hover:text-[#1e3a21]">
                      Probeer opnieuw
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
        <div className="flex-grow flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Wachtwoord vergeten?
              </h2>
              <p className="text-gray-600 mb-8">
                Geen probleem! Voer je e-mailadres in en we sturen je een link
                om je wachtwoord opnieuw in te stellen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2">
                  E-mailadres
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError(null);
                  }}
                  className={`w-full px-4 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2C5530] focus:border-[#2C5530] transition-colors text-black ${
                    validationError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="je@emailadres.nl"
                  disabled={isLoading}
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">{validationError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#814E1E] hover:bg-[#D6AD61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D6AD61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verzenden...
                  </div>
                ) : (
                  "Verstuur reset link"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="font-medium text-[#814E1E] hover:text-[#D6AD61]">
                  ← Terug naar inloggen
                </Link>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
