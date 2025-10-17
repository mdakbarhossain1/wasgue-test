"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "context/AuthContext";
import { Pencil, Trash2, Plus, Check, X, MapPin } from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    isLoggedIn,
    updateProfile,
    isLoading,
    error,
    clearError,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    newsletter: false,
    smsUpdates: false,
  });

  const [formStatus, setFormStatus] = useState({
    success: false,
    message: "",
  });

  // Address management state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "",
    firstName: "",
    lastName: "",
    street: "",
    houseNumber: "",
    houseAddition: "",
    city: "",
    postalCode: "",
    country: "NL",
  });

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    // Initialize form with user data
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        newsletter: user.preferences?.newsletter || false,
        smsUpdates: user.preferences?.smsUpdates || false,
      });
    }
  }, [isLoggedIn, router, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Reset form status
    setFormStatus({
      success: false,
      message: "",
    });

    // Prepare user data for update
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      preferences: {
        newsletter: formData.newsletter,
        smsUpdates: formData.smsUpdates,
      },
    };

    const success = await updateProfile(userData);

    if (success) {
      setFormStatus({
        success: true,
        message: "Je profiel is bijgewerkt!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFormStatus({
          success: false,
          message: "",
        });
      }, 3000);
    }
  };

  // Address handlers
  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // If country changes, clear postcode error and reset street/city for new validation
    if (name === "country") {
      setPostcodeError("");
      setNewAddress((prev) => ({
        ...prev,
        [name]: value,
        street: "",
        city: "",
      }));
    } else {
      setNewAddress((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const lookupPostcode = async () => {
    if (!newAddress.postalCode || !newAddress.houseNumber) return;

    // Only perform postcode lookup for Netherlands
    if (newAddress.country !== "NL") {
      return;
    }

    setIsLookingUpPostcode(true);
    setPostcodeError("");

    try {
      const response = await fetch(
        `/api/postcode?postcode=${encodeURIComponent(
          newAddress.postalCode
        )}&houseNumber=${encodeURIComponent(
          newAddress.houseNumber
        )}&addition=${encodeURIComponent(newAddress.houseAddition || "")}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Adres niet gevonden");
      }

      const data = await response.json();

      // Update address with the found data
      setNewAddress((prev) => ({
        ...prev,
        street: data.street || "",
        city: data.city || "",
      }));
    } catch (error) {
      console.error("Postcode lookup error:", error);
      setPostcodeError(
        error instanceof Error ? error.message : "Adres niet gevonden"
      );
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  useEffect(() => {
    if (
      newAddress.postalCode &&
      newAddress.houseNumber &&
      newAddress.country === "NL"
    ) {
      const timeoutId = setTimeout(() => {
        lookupPostcode();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [newAddress.postalCode, newAddress.houseNumber, newAddress.country]);

  // Early return after all hooks
  if (!isLoggedIn || !user) {
    return null; // Will redirect
  }

  const handleAddAddress = async () => {
    if (
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.postalCode ||
      !newAddress.houseNumber
    ) {
      setPostcodeError("Vul alle verplichte velden in");
      return;
    }

    const success = await addAddress({
      ...newAddress,
      firstName: newAddress.firstName || user.firstName,
      lastName: newAddress.lastName || user.lastName,
    });

    if (success) {
      setIsAddingAddress(false);
      setNewAddress({
        label: "",
        firstName: "",
        lastName: "",
        street: "",
        houseNumber: "",
        houseAddition: "",
        city: "",
        postalCode: "",
        country: "NL",
      });
    }
  };

  const startEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setNewAddress({
      label: address.label || "",
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      street: address.street || "",
      houseNumber: address.houseNumber || "",
      houseAddition: address.houseAddition || "",
      city: address.city || "",
      postalCode: address.postalCode || "",
      country: address.country || "NL",
    });
  };

  const handleUpdateAddress = async () => {
    if (!editingAddressId) return;

    const success = await updateAddress(editingAddressId, newAddress);

    if (success) {
      setEditingAddressId(null);
      setNewAddress({
        label: "",
        firstName: "",
        lastName: "",
        street: "",
        houseNumber: "",
        houseAddition: "",
        city: "",
        postalCode: "",
        country: "NL",
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm("Weet je zeker dat je dit adres wilt verwijderen?")) {
      await deleteAddress(addressId);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#814E1E]">Mijn Profiel</h1>
          <p className="text-gray-600 mt-2">
            Beheer je persoonlijke gegevens en adressen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-4 border-[#D6AD61]"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#D6AD61] rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-[#814E1E]">
                    {user.displayName}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <Link
                  href="/account"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#F8F6F0] rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/account/profile"
                  className="block px-4 py-2 bg-[#814E1E] text-white rounded-lg"
                >
                  Profiel
                </Link>
                <Link
                  href="/account/orders"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#F8F6F0] rounded-lg transition-colors"
                >
                  Bestellingen
                </Link>
                <Link
                  href="/account/loyalty"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#F8F6F0] rounded-lg transition-colors"
                >
                  Loyalty Punten
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#814E1E] mb-6">
                Persoonlijke Gegevens
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {formStatus.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  {formStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Voornaam
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Achternaam
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Telefoonnummer
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Voorkeuren
                  </h3>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#D6AD61] border-gray-300 rounded focus:ring-[#D6AD61]"
                    />
                    <span className="text-sm text-gray-700">
                      Ja, ik wil graag de nieuwsbrief ontvangen
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="smsUpdates"
                      checked={formData.smsUpdates}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#D6AD61] border-gray-300 rounded focus:ring-[#D6AD61]"
                    />
                    <span className="text-sm text-gray-700">
                      Ja, ik wil SMS updates ontvangen over mijn bestellingen
                    </span>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto px-6 py-3 bg-[#814E1E] text-white font-medium rounded-lg hover:bg-[#6B3E18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Bezig met opslaan..." : "Wijzigingen opslaan"}
                  </button>
                </div>
              </form>
            </div>

            {/* Address Management Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#814E1E]">
                  Mijn Adressen
                </h2>
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#814E1E] text-white text-sm font-medium rounded-lg hover:bg-[#6B3E18] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nieuw Adres</span>
                </button>
              </div>

              {/* Address List */}
              <div className="space-y-4">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg ${
                        address.isDefault
                          ? "border-[#D6AD61] bg-[#FFF9F0]"
                          : "border-gray-200"
                      }`}
                    >
                      {editingAddressId === address.id ? (
                        // Edit Mode
                        <div className="space-y-6">
                          {/* Stap 1: Waar woon je? */}
                          <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30">
                            <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
                              <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                                1
                              </span>
                              Waar woon je?
                            </h4>
                            <div className="relative">
                              <svg
                                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <select
                                name="country"
                                value={newAddress.country}
                                onChange={handleAddressChange}
                                className="w-full pl-10 pr-4 py-3 border-2 border-[#D6AD61]/50 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] appearance-none bg-white text-gray-900 font-medium"
                              >
                                <option value="NL">🇳🇱 Nederland</option>
                                <option value="BE">🇧🇪 België</option>
                                <option value="DE">🇩🇪 Duitsland</option>
                              </select>
                              <svg
                                className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>

                            {/* Country-specific hints */}
                            {newAddress.country === "NL" && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Perfect! Je adres wordt automatisch ingevuld
                                  via je postcode en huisnummer.
                                </p>
                              </div>
                            )}

                            {newAddress.country === "BE" && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Voor België vul je alle adresvelden handmatig
                                  in. Postcode: 4 cijfers (bijv. 3900).
                                </p>
                              </div>
                            )}

                            {newAddress.country === "DE" && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Voor Duitsland vul je alle adresvelden
                                  handmatig in. Postcode: 5 cijfers (bijv.
                                  10115).
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Adres gegevens sectie */}
                          <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30">
                            <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
                              <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                                2
                              </span>
                              Adres gegevens
                            </h4>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Label (bijv. Thuis, Werk)
                            </label>
                            <input
                              type="text"
                              name="label"
                              value={newAddress.label}
                              onChange={handleAddressChange}
                              placeholder="Thuis"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Voornaam
                              </label>
                              <input
                                type="text"
                                name="firstName"
                                value={newAddress.firstName}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Achternaam
                              </label>
                              <input
                                type="text"
                                name="lastName"
                                value={newAddress.lastName}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Postcode
                                {newAddress.country === "NL" && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (adres wordt automatisch ingevuld)
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                name="postalCode"
                                value={newAddress.postalCode}
                                onChange={handleAddressChange}
                                placeholder={
                                  newAddress.country === "BE"
                                    ? "3900"
                                    : newAddress.country === "DE"
                                    ? "10115"
                                    : "1234 AB"
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Huisnummer
                              </label>
                              <input
                                type="text"
                                name="houseNumber"
                                value={newAddress.houseNumber}
                                onChange={handleAddressChange}
                                placeholder="123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Toevoeging
                              </label>
                              <input
                                type="text"
                                name="houseAddition"
                                value={newAddress.houseAddition}
                                onChange={handleAddressChange}
                                placeholder="A"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Straat
                              </label>
                              <input
                                type="text"
                                name="street"
                                value={newAddress.street}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                                disabled={
                                  isLookingUpPostcode &&
                                  newAddress.country === "NL"
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stad
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={newAddress.city}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                                disabled={
                                  isLookingUpPostcode &&
                                  newAddress.country === "NL"
                                }
                              />
                            </div>
                          </div>

                          {postcodeError && (
                            <p className="text-sm text-red-600">
                              {postcodeError}
                            </p>
                          )}

                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingAddressId(null);
                                setNewAddress({
                                  label: "",
                                  firstName: "",
                                  lastName: "",
                                  street: "",
                                  houseNumber: "",
                                  houseAddition: "",
                                  city: "",
                                  postalCode: "",
                                  country: "NL",
                                });
                              }}
                              className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                              Annuleren
                            </button>
                            <button
                              onClick={handleUpdateAddress}
                              className="px-4 py-2 bg-[#814E1E] text-white rounded-lg hover:bg-[#6B3E18] transition-colors"
                            >
                              Opslaan
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {address.label || "Adres"}
                              </h3>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-[#D6AD61] text-white text-xs rounded">
                                  Standaard
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.street} {address.houseNumber}
                              {address.houseAddition || ""}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.postalCode} {address.city}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(() => {
                                switch (address.country) {
                                  case "NL":
                                    return "Nederland";
                                  case "BE":
                                    return "België";
                                  case "DE":
                                    return "Duitsland";
                                  default:
                                    return address.country;
                                }
                              })()}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!address.isDefault && (
                              <button
                                onClick={() =>
                                  handleSetDefaultAddress(address.id)
                                }
                                className="p-2 text-gray-400 hover:text-[#D6AD61] transition-colors"
                                title="Instellen als standaard"
                              >
                                <MapPin className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditAddress(address)}
                              className="p-2 text-gray-400 hover:text-[#814E1E] transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Je hebt nog geen adressen toegevoegd.
                  </p>
                )}

                {/* Add New Address Form - Simplified */}
                {isAddingAddress && (
                  <div className="p-4 border border-[#D6AD61] rounded-lg bg-[#FFF9F0]">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Nieuw Adres Toevoegen
                    </h3>

                    <div className="space-y-6">
                      {/* Stap 1: Waar woon je? */}
                      <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30">
                        <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
                          <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                            1
                          </span>
                          Waar woon je?
                        </h4>
                        <div className="relative">
                          <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <select
                            name="country"
                            value={newAddress.country}
                            onChange={handleAddressChange}
                            className="w-full pl-10 pr-4 py-3 border-2 border-[#D6AD61]/50 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] appearance-none bg-white text-gray-900 font-medium"
                          >
                            <option value="">-- Kies je land --</option>
                            <option value="NL">🇳🇱 Nederland</option>
                            <option value="BE">🇧🇪 België</option>
                            <option value="DE">🇩🇪 Duitsland</option>
                          </select>
                          <svg
                            className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        {/* Country-specific hints */}
                        {newAddress.country === "NL" && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700 flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Perfect! Je adres wordt automatisch ingevuld via
                              je postcode en huisnummer.
                            </p>
                          </div>
                        )}

                        {newAddress.country === "BE" && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Voor België vul je alle adresvelden handmatig in.
                              Postcode: 4 cijfers (bijv. 3900).
                            </p>
                          </div>
                        )}

                        {newAddress.country === "DE" && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Voor Duitsland vul je alle adresvelden handmatig
                              in. Postcode: 5 cijfers (bijv. 10115).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Toon alleen verdere velden als land is gekozen */}
                      {newAddress.country && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30">
                            <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
                              <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                                2
                              </span>
                              Adres gegevens
                            </h4>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Label (bijv. Thuis, Werk)
                              </label>
                              <input
                                type="text"
                                name="label"
                                value={newAddress.label}
                                onChange={handleAddressChange}
                                placeholder="Thuis"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Voornaam
                              </label>
                              <input
                                type="text"
                                name="firstName"
                                value={newAddress.firstName}
                                onChange={handleAddressChange}
                                placeholder={user.firstName}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Achternaam
                              </label>
                              <input
                                type="text"
                                name="lastName"
                                value={newAddress.lastName}
                                onChange={handleAddressChange}
                                placeholder={user.lastName}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Postcode *
                              </label>
                              <input
                                type="text"
                                name="postalCode"
                                value={newAddress.postalCode}
                                onChange={handleAddressChange}
                                placeholder="1234 AB"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Huisnummer *
                              </label>
                              <input
                                type="text"
                                name="houseNumber"
                                value={newAddress.houseNumber}
                                onChange={handleAddressChange}
                                placeholder="123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Toevoeging
                              </label>
                              <input
                                type="text"
                                name="houseAddition"
                                value={newAddress.houseAddition}
                                onChange={handleAddressChange}
                                placeholder="A"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Straat *
                              </label>
                              <input
                                type="text"
                                name="street"
                                value={newAddress.street}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                                disabled={isLookingUpPostcode}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stad *
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={newAddress.city}
                                onChange={handleAddressChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                                disabled={isLookingUpPostcode}
                              />
                            </div>
                          </div>

                          {isLookingUpPostcode && (
                            <p className="text-sm text-gray-500">
                              Adres wordt opgezocht...
                            </p>
                          )}

                          {postcodeError && (
                            <p className="text-sm text-red-600">
                              {postcodeError}
                            </p>
                          )}

                          <div className="flex justify-end space-x-2 pt-4">
                            <button
                              onClick={() => {
                                setIsAddingAddress(false);
                                setNewAddress({
                                  label: "",
                                  firstName: "",
                                  lastName: "",
                                  street: "",
                                  houseNumber: "",
                                  houseAddition: "",
                                  city: "",
                                  postalCode: "",
                                  country: "",
                                });
                                setPostcodeError("");
                              }}
                              className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                              Annuleren
                            </button>
                            <button
                              onClick={handleAddAddress}
                              disabled={!newAddress.country}
                              className="px-4 py-2 bg-[#814E1E] text-white rounded-lg hover:bg-[#6B3E18] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Toevoegen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#814E1E] mb-6">
                Wachtwoord Wijzigen
              </h2>

              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Huidig Wachtwoord
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nieuw Wachtwoord
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bevestig Nieuw Wachtwoord
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-[#814E1E] text-white font-medium rounded-lg hover:bg-[#6B3E18] transition-colors"
                  >
                    Wachtwoord Wijzigen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
