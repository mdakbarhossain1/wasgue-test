"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "context/AuthContext";
import Footer from "components/sections/Footer";

function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    newsletter: true,
    smsUpdates: false,
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { register, isLoading, error, clearError, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirectUrl);
    }
  }, [isLoggedIn, router, redirectUrl]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "Voornaam is verplicht";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Achternaam is verplicht";
    }

    if (!formData.email.trim()) {
      errors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Voer een geldig e-mailadres in";
    }

    if (!formData.password) {
      errors.password = "Wachtwoord is verplicht";
    } else if (formData.password.length < 6) {
      errors.password = "Wachtwoord moet minimaal 6 karakters bevatten";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Bevestig je wachtwoord";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = "Je moet de algemene voorwaarden accepteren";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const success = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        preferences: {
          newsletter: formData.newsletter,
          smsUpdates: formData.smsUpdates,
        },
      });

      if (success) {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      // Error handling is managed by the AuthContext
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
        <div className="flex-grow flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-6">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold text-[#814E1E]">
                Account aanmaken
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Maak een account aan om je bestellingen te volgen en exclusieve
                voordelen te ontvangen
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-[#814E1E] mb-2">
                      Voornaam *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors ${
                        validationErrors.firstName
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Jan"
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-[#814E1E] mb-2">
                      Achternaam *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors ${
                        validationErrors.lastName
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Jansen"
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#814E1E] mb-2">
                    E-mailadres *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors ${
                      validationErrors.email
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="jan@email.nl"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-[#814E1E] mb-2">
                    Telefoonnummer
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors"
                    placeholder="06 12345678"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#814E1E] mb-2">
                    Wachtwoord *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors pr-12 ${
                        validationErrors.password
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#814E1E]">
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.password}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimaal 6 karakters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-[#814E1E] mb-2">
                    Bevestig wachtwoord *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] transition-colors pr-12 ${
                        validationErrors.confirmPassword
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#814E1E]">
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="h-4 w-4 mt-0.5 text-[#D6AD61] focus:ring-[#D6AD61] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="newsletter"
                    className="ml-3 block text-sm text-gray-700">
                    <span className="font-medium">Nieuwsbrief ontvangen</span>
                    <p className="text-gray-500">
                      Ontvang exclusieve aanbiedingen en nieuws over nieuwe
                      geuren
                    </p>
                  </label>
                </div>

                {/* <div className="flex items-start">
                  <input
                    id="smsUpdates"
                    name="smsUpdates"
                    type="checkbox"
                    checked={formData.smsUpdates}
                    onChange={handleInputChange}
                    className="h-4 w-4 mt-0.5 text-[#D6AD61] focus:ring-[#D6AD61] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="smsUpdates"
                    className="ml-3 block text-sm text-gray-700"
                  >
                    <span className="font-medium">SMS updates</span>
                    <p className="text-gray-500">
                      Ontvang SMS berichten over je bestellingen
                    </p>
                  </label>
                </div> */}

                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className={`h-4 w-4 mt-0.5 text-[#D6AD61] focus:ring-[#D6AD61] border-gray-300 rounded ${
                      validationErrors.acceptTerms ? "border-red-300" : ""
                    }`}
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="ml-3 block text-sm text-gray-700">
                    <span className="font-medium">Ik ga akkoord met de </span>
                    <Link
                      href="/terms"
                      className="text-[#814E1E] hover:text-[#D6AD61] underline">
                      algemene voorwaarden
                    </Link>
                    <span className="font-medium"> en </span>
                    <Link
                      href="/privacy"
                      className="text-[#814E1E] hover:text-[#D6AD61] underline">
                      privacybeleid
                    </Link>
                    <span className="text-red-500"> *</span>
                  </label>
                </div>
                {validationErrors.acceptTerms && (
                  <p className="text-xs text-red-600 ml-7">
                    {validationErrors.acceptTerms}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#814E1E] hover:bg-[#D6AD61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D6AD61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Account aanmaken...
                    </div>
                  ) : (
                    "Account aanmaken"
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Heb je al een account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-[#814E1E] hover:text-[#D6AD61]">
                    Log hier in
                  </Link>
                </p>
              </div>
            </form>

            {/* Benefits section */}
            <div className="mt-6 p-4 bg-gradient-to-br from-[#D6AD61]/10 to-[#814E1E]/10 border border-[#D6AD61]/20 rounded-lg">
              <h3 className="text-sm font-medium text-[#814E1E] mb-3">
                Voordelen van een account:
              </h3>
              <ul className="text-xs text-gray-700 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Loyalty punten verdienen bij elke bestelling
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Bestellingen volgen en geschiedenis bekijken
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sneller afrekenen met opgeslagen gegevens
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Exclusieve aanbiedingen en early access
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* <Footer /> */}
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6AD61]"></div>
        </div>
      }>
      <RegisterFormWrapper />
    </Suspense>
  );
}

const RegisterFormWrapper = () => {
  return (
    <>
      <RegisterForm />
    </>
  );
};
