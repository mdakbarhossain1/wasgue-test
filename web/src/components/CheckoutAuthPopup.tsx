"use client";

import React, { useState } from "react";
import { useAuth } from "context/AuthContext";
import Image from "next/image";

interface CheckoutAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CheckoutAuthPopup({
  isOpen,
  onClose,
  onSuccess,
}: CheckoutAuthPopupProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    showPassword: false,
  });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    newsletter: true,
    acceptTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { login, register, isLoading, error, clearError } = useAuth();

  const validateLoginForm = () => {
    const errors: Record<string, string> = {};

    if (!loginData.email.trim()) {
      errors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = "Voer een geldig e-mailadres in";
    }

    if (!loginData.password) {
      errors.password = "Wachtwoord is verplicht";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};

    if (!registerData.firstName.trim()) {
      errors.firstName = "Voornaam is verplicht";
    }

    if (!registerData.lastName.trim()) {
      errors.lastName = "Achternaam is verplicht";
    }

    if (!registerData.email.trim()) {
      errors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = "Voer een geldig e-mailadres in";
    }

    if (!registerData.password) {
      errors.password = "Wachtwoord is verplicht";
    } else if (registerData.password.length < 6) {
      errors.password = "Wachtwoord moet minimaal 6 karakters bevatten";
    }

    if (!registerData.confirmPassword) {
      errors.confirmPassword = "Bevestig je wachtwoord";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    if (!registerData.acceptTerms) {
      errors.acceptTerms = "Je moet de algemene voorwaarden accepteren";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateLoginForm()) {
      return;
    }

    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        // Show success message briefly before closing
        const successDiv = document.createElement("div");
        successDiv.className =
          "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
        successDiv.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Welkom terug! Je bent succesvol ingelogd</span>
          </div>
        `;
        document.body.appendChild(successDiv);

        setTimeout(() => {
          successDiv.remove();
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateRegisterForm()) {
      return;
    }

    try {
      const success = await register({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        preferences: {
          newsletter: registerData.newsletter,
          smsUpdates: false,
        },
      });

      if (success) {
        // Show success message briefly before closing
        const successDiv = document.createElement("div");
        successDiv.className =
          "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
        successDiv.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Account succesvol aangemaakt! Welkom bij Wasgeurtje</span>
          </div>
        `;
        document.body.appendChild(successDiv);

        setTimeout(() => {
          successDiv.remove();
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Register error:", err);
    }
  };

  const handleInputChange =
    (data: any, setData: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setData((prev: any) => ({
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

  const switchMode = () => {
    setIsLogin(!isLogin);
    setValidationErrors({});
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#D6AD61] rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isLogin ? "Inloggen" : "Account aanmaken"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Switch */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-white text-[#814E1E] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}>
              Inloggen
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-white text-[#814E1E] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}>
              Registreren
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres *
                </label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginData.email}
                  onChange={handleInputChange(loginData, setLoginData)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                    validationErrors.email
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="je@voorbeeld.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord *
                </label>
                <div className="relative">
                  <input
                    type={loginData.showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange(loginData, setLoginData)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                      validationErrors.password
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLoginData((prev) => ({
                        ...prev,
                        showPassword: !prev.showPassword,
                      }))
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {loginData.showPassword ? (
                      <svg
                        className="h-5 w-5"
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
                        className="h-5 w-5"
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
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#814E1E] hover:bg-[#D6AD61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D6AD61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading ? "Bezig met inloggen..." : "Inloggen"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="register-firstName"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam *
                  </label>
                  <input
                    type="text"
                    id="register-firstName"
                    name="firstName"
                    value={registerData.firstName}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                      validationErrors.firstName
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Jan"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="register-lastName"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam *
                  </label>
                  <input
                    type="text"
                    id="register-lastName"
                    name="lastName"
                    value={registerData.lastName}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                      validationErrors.lastName
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Jansen"
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres *
                </label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={registerData.email}
                  onChange={handleInputChange(registerData, setRegisterData)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                    validationErrors.email
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="je@voorbeeld.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  id="register-phone"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleInputChange(registerData, setRegisterData)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61]"
                  placeholder="+31 6 12345678"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord *
                </label>
                <div className="relative">
                  <input
                    type={registerData.showPassword ? "text" : "password"}
                    id="register-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                      validationErrors.password
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRegisterData((prev) => ({
                        ...prev,
                        showPassword: !prev.showPassword,
                      }))
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {registerData.showPassword ? (
                      <svg
                        className="h-5 w-5"
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
                        className="h-5 w-5"
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
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Bevestig wachtwoord *
                </label>
                <div className="relative">
                  <input
                    type={
                      registerData.showConfirmPassword ? "text" : "password"
                    }
                    id="register-confirmPassword"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-[#D6AD61] focus:border-[#D6AD61] ${
                      validationErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRegisterData((prev) => ({
                        ...prev,
                        showConfirmPassword: !prev.showConfirmPassword,
                      }))
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {registerData.showConfirmPassword ? (
                      <svg
                        className="h-5 w-5"
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
                        className="h-5 w-5"
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
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="register-newsletter"
                    name="newsletter"
                    type="checkbox"
                    checked={registerData.newsletter}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className="h-4 w-4 text-[#814E1E] focus:ring-[#D6AD61] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="register-newsletter"
                    className="ml-2 block text-sm text-gray-700">
                    Ja, ik wil de nieuwsbrief ontvangen
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="register-acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={registerData.acceptTerms}
                    onChange={handleInputChange(registerData, setRegisterData)}
                    className={`h-4 w-4 text-[#814E1E] focus:ring-[#D6AD61] border-gray-300 rounded mt-0.5 ${
                      validationErrors.acceptTerms ? "border-red-300" : ""
                    }`}
                  />
                  <label
                    htmlFor="register-acceptTerms"
                    className="ml-2 block text-sm text-gray-700">
                    Ik ga akkoord met de{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-[#814E1E] underline hover:no-underline">
                      algemene voorwaarden
                    </a>{" "}
                    en{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-[#814E1E] underline hover:no-underline">
                      privacyverklaring
                    </a>
                  </label>
                </div>
                {validationErrors.acceptTerms && (
                  <p className="text-sm text-red-600">
                    {validationErrors.acceptTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#814E1E] hover:bg-[#D6AD61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D6AD61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading ? "Account aanmaken..." : "Account aanmaken"}
              </button>
            </form>
          )}

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Voordelen van een account:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verdien loyalty punten bij elke bestelling
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
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
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Bestellingsgeschiedenis bekijken
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
