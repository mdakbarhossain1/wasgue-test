"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// import { useAuth } from '@/context/AuthContext';
import { Pencil, Trash2, Plus, Check, X, MapPin } from "lucide-react";
// import AddressForm from '@/components/AddressForm';
import { useAuth } from "context/AuthContext";
import AddressForm from "components/AddressForm";

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

  // Redirect if not logged in and initialize form data
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

  // Early return after all hooks
  if (!isLoggedIn || !user) {
    return null; // Will redirect
  }

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

    try {
      const success = await updateProfile(formData);
      if (success) {
        setFormStatus({
          success: true,
          message: "Profiel succesvol bijgewerkt!",
        });

        // Clear message after 3 seconds
        setTimeout(() => {
          setFormStatus({ success: false, message: "" });
        }, 3000);
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const handleAddAddress = async (addressData: any) => {
    const success = await addAddress({
      ...addressData,
      firstName: addressData.firstName || user.firstName,
      lastName: addressData.lastName || user.lastName,
    });

    if (success) {
      setIsAddingAddress(false);
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
  };

  const handleUpdateAddress = async (addressData: any) => {
    const success = await updateAddress(editingAddressId!, {
      ...addressData,
      firstName: addressData.firstName || user.firstName,
      lastName: addressData.lastName || user.lastName,
    });

    if (success) {
      setEditingAddressId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
  };

  const handleCancelAdd = () => {
    setIsAddingAddress(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="flex items-center text-[#814E1E] hover:text-[#D6AD61] transition-colors mb-4">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Terug naar mijn account</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#814E1E] mb-2">
            Mijn profiel
          </h1>
          <p className="text-gray-600">
            Beheer je persoonlijke gegevens en adressen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Info Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#814E1E] mb-6 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
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
              Persoonlijke gegevens
            </h2>

            {formStatus.success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {formStatus.message}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent"
                />
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newsletter"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#814E1E] border-gray-300 rounded focus:ring-[#D6AD61]"
                  />
                  <label
                    htmlFor="newsletter"
                    className="ml-2 text-sm text-gray-700">
                    Nieuwsbrief ontvangen
                  </label>
                </div>
                {/* <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsUpdates"
                    name="smsUpdates"
                    checked={formData.smsUpdates}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#814E1E] border-gray-300 rounded focus:ring-[#D6AD61]"
                  />
                  <label
                    htmlFor="smsUpdates"
                    className="ml-2 text-sm text-gray-700"
                  >
                    SMS updates ontvangen
                  </label>
                </div> */}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#814E1E] text-white py-3 px-4 rounded-lg hover:bg-[#D6AD61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                  {isLoading ? "Opslaan..." : "Profiel bijwerken"}
                </button>
              </div>
            </form>
          </div>

          {/* Address Management Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#814E1E] flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Mijn adressen
              </h2>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="sm:flex items-center px-4 py-2 bg-[#814E1E] text-white rounded-lg hover:bg-[#D6AD61] transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Nieuw adres
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
                    }`}>
                    {editingAddressId === address.id ? (
                      <AddressForm
                        initialValues={address}
                        onSubmit={handleUpdateAddress}
                        onCancel={handleCancelEdit}
                      />
                    ) : (
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
                              onClick={() => setDefaultAddress(address.id)}
                              className="text-sm text-[#814E1E] hover:text-[#D6AD61] transition-colors">
                              Standaard maken
                            </button>
                          )}
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-2 text-gray-400 hover:text-[#814E1E] transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAddress(address.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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

              {/* Add New Address Form */}
              {isAddingAddress && (
                <div className="p-4 border border-[#D6AD61] rounded-lg bg-[#FFF9F0]">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Nieuw Adres Toevoegen
                  </h3>
                  <AddressForm
                    onSubmit={handleAddAddress}
                    onCancel={handleCancelAdd}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
