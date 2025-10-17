'use client';

import { useState, useRef, useEffect } from 'react';

interface AddressFormProps {
  onSubmit: (address: any) => void;
  onCancel: () => void;
  initialValues?: any;
}

export default function AddressForm({ onSubmit, onCancel, initialValues }: AddressFormProps) {
  const [formData, setFormData] = useState({
    label: initialValues?.label || '',
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    street: initialValues?.street || '',
    houseNumber: initialValues?.houseNumber || '',
    houseAddition: initialValues?.houseAddition || '',
    city: initialValues?.city || '',
    postalCode: initialValues?.postalCode || '',
    country: initialValues?.country || ''
  });

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState('');
  const [addressFound, setAddressFound] = useState(false);

  const addressSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to address section when country is selected
  useEffect(() => {
    if (formData.country && addressSectionRef.current) {
      setTimeout(() => {
        addressSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Add a subtle pulse effect to draw attention
        if (addressSectionRef.current) {
          addressSectionRef.current.style.transform = 'scale(1.02)';
          setTimeout(() => {
            if (addressSectionRef.current) {
              addressSectionRef.current.style.transform = 'scale(1)';
            }
          }, 300);
        }
      }, 200); // Slightly longer delay for better UX
    }
  }, [formData.country]);

  // Auto-trigger postcode lookup for Netherlands when postcode and house number are filled
  useEffect(() => {
    if (formData.country === 'NL' && formData.postalCode && formData.houseNumber) {
      const timeoutId = setTimeout(() => {
        lookupPostcode();
      }, 500); // 500ms delay to avoid too many API calls while typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.postalCode, formData.houseNumber, formData.houseAddition, formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If country changes, clear address fields
    if (name === 'country') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        street: '',
        city: '',
        postalCode: ''
      }));
      // Clear postcode lookup state
      setPostcodeError('');
      setAddressFound(false);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear postcode error when user types in postcode/house number fields
      if (name === 'postalCode' || name === 'houseNumber' || name === 'houseAddition') {
        setPostcodeError('');
        setAddressFound(false);
      }
    }
  };

  // Postcode lookup function for Netherlands only
  const lookupPostcode = async (retryCount = 0) => {
    // Only lookup postcodes for Netherlands
    if (formData.country !== 'NL') {
      return;
    }
    
    if (!formData.postalCode || !formData.houseNumber) {
      return;
    }

    setIsLookingUpPostcode(true);
    setPostcodeError('');
    setAddressFound(false);

    try {
      const response = await fetch(
        `/api/postcode?postcode=${encodeURIComponent(formData.postalCode)}&houseNumber=${encodeURIComponent(formData.houseNumber)}&addition=${encodeURIComponent(formData.houseAddition || '')}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Adres niet gevonden';
        
        // Set error state without throwing an exception
        setPostcodeError(errorMessage);
        setAddressFound(false);
        
        // Clear the auto-filled fields
        setFormData(prev => ({
          ...prev,
          street: '',
          city: ''
        }));
        
        setIsLookingUpPostcode(false);
        return;
      }

      const data = await response.json();
      
      // Update form with the found address
      setFormData(prev => ({
        ...prev,
        street: data.street || '',
        city: data.city || ''
      }));

      setAddressFound(true);
      setIsLookingUpPostcode(false);

    } catch (error) {
      // Only log actual network/fetch errors
      if (error instanceof TypeError) {
        console.error('Network error during postcode lookup:', error);
        
        // Retry logic for network errors
        if (retryCount < 2) {
          console.log(`Retrying postcode lookup (attempt ${retryCount + 2}/3)...`);
          setTimeout(() => {
            lookupPostcode(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
          return;
        }
        
        setPostcodeError('Verbindingsfout. Probeer het opnieuw.');
      } else {
        // For any other unexpected errors
        setPostcodeError('Er is een fout opgetreden. Probeer het opnieuw.');
      }
      
      setAddressFound(false);
      
      // Clear the auto-filled fields when API fails
      setFormData(prev => ({
        ...prev,
        street: '',
        city: ''
      }));
      setIsLookingUpPostcode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stap 1: Land Selectie */}
      <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30">
        <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
          <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
          Waar woon je?
        </h4>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-[#D6AD61]/50 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-[#D6AD61] appearance-none bg-white text-gray-900 font-medium"
        >
          <option value="">-- Kies je land --</option>
          <option value="NL">🇳🇱 Nederland</option>
          <option value="BE">🇧🇪 België</option>
          <option value="DE">🇩🇪 Duitsland</option>
        </select>
        
        {/* Country specific hints */}
        {formData.country === 'NL' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">✅ Voor Nederland wordt je adres automatisch ingevuld via postcode</p>
          </div>
        )}
        {formData.country === 'BE' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">ℹ️ Voor België vul je alle velden handmatig in. Postcode: 4 cijfers (bijv. 3900)</p>
          </div>
        )}
        {formData.country === 'DE' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">ℹ️ Voor Duitsland vul je alle velden handmatig in. Postcode: 5 cijfers (bijv. 10115)</p>
          </div>
        )}
      </div>

      {/* Stap 2: Adres gegevens - alleen tonen als land is gekozen */}
      {formData.country && (
        <div ref={addressSectionRef} className="bg-gradient-to-r from-[#FFF9F0] to-white p-4 rounded-lg border border-[#D6AD61]/30 space-y-4 animate-in slide-in-from-top duration-500 transition-transform duration-300 ease-out">
          <h4 className="font-semibold text-[#814E1E] mb-3 flex items-center">
            <span className="bg-[#814E1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
            Adres gegevens
          </h4>

          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Label (bijv. Thuis, Werk)</label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder="Thuis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Naam velden */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Voornaam</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Achternaam</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Postcode en huisnummer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Postcode *
                {formData.country === 'NL' && <span className="text-xs text-gray-600 ml-1">(automatisch invullen)</span>}
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                placeholder={formData.country === 'BE' ? '3900' : formData.country === 'DE' ? '10115' : '1234 AB'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Huisnummer *</label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                required
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Toevoeging</label>
              <input
                type="text"
                name="houseAddition"
                value={formData.houseAddition}
                onChange={handleChange}
                placeholder="A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Postcode lookup feedback for Netherlands */}
          {formData.country === 'NL' && (
            <div className="mt-2">
              {isLookingUpPostcode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adres wordt opgezocht...
                  </p>
                </div>
              )}
              
              {addressFound && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">✅ Adres gevonden en automatisch ingevuld</p>
                </div>
              )}
              
              {postcodeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">❌ {postcodeError}</p>
                  <p className="text-xs text-red-600 mt-1">Vul de adresgegevens handmatig in</p>
                </div>
              )}
            </div>
          )}

          {/* Straat en stad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Straat *
                {formData.country === 'NL' && addressFound && <span className="text-xs text-green-600 ml-1">✓ Automatisch ingevuld</span>}
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white ${addressFound && formData.country === 'NL' ? 'bg-green-50 border-green-300' : ''}`}
                placeholder="Straatnaam"
                readOnly={formData.country === 'NL' && addressFound}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Stad *
                {formData.country === 'NL' && addressFound && <span className="text-xs text-green-600 ml-1">✓ Automatisch ingevuld</span>}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6AD61] focus:border-transparent text-gray-900 bg-white ${addressFound && formData.country === 'NL' ? 'bg-green-50 border-green-300' : ''}`}
                placeholder="Stadsnaam"
                readOnly={formData.country === 'NL' && addressFound}
              />
            </div>
          </div>

          {/* Knoppen */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#814E1E] text-white rounded-lg hover:bg-[#6B3E18] transition-colors"
            >
              Opslaan
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
