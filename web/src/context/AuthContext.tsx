"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  fetchCustomerByEmail,
  fetchCustomerOrders,
  fetchCustomerLoyaltyPoints,
  fetchLoyaltyPointsByEmail,
  createCustomer,
  updateCustomer,
  fetchCustomerAddress,
} from "utils/auth-api";

const WORDPRESS_API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";

export interface Address {
  id: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  houseNumber: string;
  houseAddition?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  role?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  addresses?: Address[]; // Multiple addresses
  preferences?: {
    newsletter: boolean;
    smsUpdates: boolean;
  };
  loyalty?: {
    points: number;
    totalEarned: number;
    rewardsAvailable: number;
    referCode?: string;
    levelId?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shippingAddress: {
    name?: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingCode?: string;
}

interface RedeemResult {
  success: boolean;
  message?: string;
  coupon_code?: string;
  discount_amount?: number;
  remaining_points?: number;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  orders: Order[];
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  sessionRestored: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    userData: Partial<User> & { password: string }
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  fetchOrders: () => Promise<void>;
  fetchLoyaltyPoints: () => Promise<void>;
  fetchLoyaltyPointsByUserEmail: (email?: string) => Promise<void>;
  redeemPoints: () => Promise<RedeemResult>;
  checkRedeemEligibility: () => Promise<{
    eligible: boolean;
    canRedeemTimes: number;
    currentPoints: number;
  }>;
  error: string | null;
  clearError: () => void;
  addAddress: (address: Omit<Address, "id">) => Promise<boolean>;
  updateAddress: (
    addressId: string,
    address: Partial<Address>
  ) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (
    token: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem("wasgeurtje-user");
      const token = localStorage.getItem("wasgeurtje-token");

      if (savedUser && token) {
        try {
          // Restore user session (zonder token validatie omdat we geen JWT endpoint hebben)
          const userData = JSON.parse(savedUser);

          // Controleer of de user data geldig is
          if (userData && userData.id && userData.email) {
            // Hydrate address from WooCommerce to avoid stale/local values
            try {
              const addr = await fetchCustomerAddress(userData.id);
              const hydratedUser = {
                ...userData,
                phone: addr.billing?.phone || userData.phone || "",
                address: {
                  street:
                    addr.billing?.address_1 ||
                    addr.shipping?.address_1 ||
                    userData.address?.street ||
                    "",
                  city:
                    addr.billing?.city ||
                    addr.shipping?.city ||
                    userData.address?.city ||
                    "",
                  postalCode:
                    addr.billing?.postcode ||
                    addr.shipping?.postcode ||
                    userData.address?.postalCode ||
                    "",
                  country:
                    addr.billing?.country ||
                    addr.shipping?.country ||
                    userData.address?.country ||
                    "NL",
                },
              } as User;

              // Migrate old address format to new addresses array
              if (hydratedUser.address && !hydratedUser.addresses) {
                hydratedUser.addresses = [
                  {
                    id: "1",
                    label: "Thuis",
                    firstName: hydratedUser.firstName || "",
                    lastName: hydratedUser.lastName || "",
                    street: hydratedUser.address.street || "",
                    houseNumber: "",
                    houseAddition: "",
                    city: hydratedUser.address.city || "",
                    postalCode: hydratedUser.address.postalCode || "",
                    country: hydratedUser.address.country || "NL",
                    isDefault: true,
                  },
                ];
              }
              setUser(hydratedUser);
              localStorage.setItem(
                "wasgeurtje-user",
                JSON.stringify(hydratedUser)
              );
            } catch (e) {
              // Fallback to saved user if WooCommerce fetch fails
              setUser(userData);
            }
            // Fetch fresh orders when user is restored
            await fetchOrdersForUser(userData.id);
          } else {
            throw new Error("Ongeldige gebruikersdata");
          }
        } catch (error) {
          console.error("Error restoring session:", error);
          localStorage.removeItem("wasgeurtje-user");
          localStorage.removeItem("wasgeurtje-token");
        }
      }

      // Mark session restore as complete
      setSessionRestored(true);
    };

    restoreSession();
  }, []); // Empty dependency array - only run once on mount

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // JWT authenticatie via WooCommerce API
      const customer = await fetchCustomerByEmail(email, password);

      // JWT token wordt opgeslagen in fetchCustomerByEmail

      // Transform WooCommerce customer data to our User interface
      console.log("DEBUG: Customer object before transformation:", customer);
      console.log("DEBUG: Customer billing data:", customer.billing);
      console.log("DEBUG: Customer shipping data:", customer.shipping);
      console.log("DEBUG: Billing address_1:", customer.billing?.address_1);
      console.log("DEBUG: Billing city:", customer.billing?.city);
      console.log("DEBUG: Billing postcode:", customer.billing?.postcode);
      console.log("DEBUG: Billing country:", customer.billing?.country);

      const addressStreet =
        customer.billing?.address_1 || customer.shipping?.address_1 || "";
      const addressCity =
        customer.billing?.city || customer.shipping?.city || "";
      const addressPostcode =
        customer.billing?.postcode || customer.shipping?.postcode || "";
      const addressCountry =
        customer.billing?.country || customer.shipping?.country || "NL";

      console.log("DEBUG: Extracted address data:", {
        street: addressStreet,
        city: addressCity,
        postcode: addressPostcode,
        country: addressCountry,
      });

      // Hydrate with a fresh address fetch to ensure we use WooCommerce truth
      let wcAddress = null as any;
      try {
        wcAddress = await fetchCustomerAddress(customer.id?.toString() || "");
      } catch {}

      const userData: User = {
        id: customer.id?.toString() || "",
        email: customer.email || customer.user_email || "",
        firstName: customer.first_name || "",
        lastName: customer.last_name || "",
        displayName:
          customer.user_display_name ||
          (customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`.trim()
            : customer.username ||
              customer.email?.split("@")[0] ||
              "Gebruiker"),
        avatar:
          customer.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            `${customer.first_name || ""} ${customer.last_name || ""}`
          )}&background=D6AD61&color=fff`,
        phone: wcAddress?.billing?.phone || customer.billing?.phone || "",
        address: {
          street:
            wcAddress?.billing?.address_1 ||
            wcAddress?.shipping?.address_1 ||
            addressStreet,
          city:
            wcAddress?.billing?.city ||
            wcAddress?.shipping?.city ||
            addressCity,
          postalCode:
            wcAddress?.billing?.postcode ||
            wcAddress?.shipping?.postcode ||
            addressPostcode,
          country:
            wcAddress?.billing?.country ||
            wcAddress?.shipping?.country ||
            addressCountry,
        },
        preferences: {
          newsletter: Array.isArray(customer.meta_data)
            ? customer.meta_data.find(
                (meta: any) => meta.key === "newsletter_subscription"
              )?.value !== "false"
            : true,
          smsUpdates: Array.isArray(customer.meta_data)
            ? customer.meta_data.find((meta: any) => meta.key === "sms_updates")
                ?.value === "true"
            : false,
        },
      };

      // Log the final user data before setting it
      console.log("DEBUG: Final user data being saved:", userData);
      console.log("DEBUG: Final address data:", userData.address);
      console.log("DEBUG: Address mapping details:", {
        original_billing_address: customer.billing?.address_1,
        original_billing_city: customer.billing?.city,
        original_billing_postcode: customer.billing?.postcode,
        mapped_street: userData.address?.street || "",
        mapped_city: userData.address?.city || "",
        mapped_postalCode: userData.address?.postalCode || "",
      });

      setUser(userData);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(userData));

      // Fetch real orders after successful login
      await fetchOrdersForUser(userData.id);

      // Fetch loyalty points using the new email-based endpoint
      try {
        console.log(
          `DEBUG: Fetching loyalty points for login using email: ${userData.email}`
        );
        const loyaltyData = await fetchLoyaltyPointsByEmail(userData.email);

        if (loyaltyData) {
          // Update userData with loyalty info before setting user
          userData.loyalty = {
            points: loyaltyData.points || 0,
            totalEarned: loyaltyData.total_earned || 0,
            rewardsAvailable: loyaltyData.rewards_available || 0,
            referCode: loyaltyData.refer_code || "",
            levelId: loyaltyData.level_id || "0",
          };

          // Update user state and localStorage with fresh loyalty data
          setUser(userData);
          localStorage.setItem("wasgeurtje-user", JSON.stringify(userData));
        }
      } catch (loyaltyError) {
        console.error(
          "Error fetching loyalty points during login:",
          loyaltyError
        );
        // Fallback to old method
        await fetchLoyaltyPointsForUser(userData.id);
      }

      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Inloggen mislukt. Controleer je gegevens.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: Partial<User> & { password: string }
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create customer in WooCommerce (this will also create WordPress user)
      const customerData = {
        email: userData.email || "",
        first_name: userData.firstName || "",
        last_name: userData.lastName || "",
        username: userData.email || "",
        password: userData.password, // Belangrijk: wachtwoord meegeven voor registratie
        billing: {
          first_name: userData.firstName || "",
          last_name: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          country: "NL",
        },
        shipping: {
          first_name: userData.firstName || "",
          last_name: userData.lastName || "",
          country: "NL",
        },
        meta_data: [
          {
            key: "newsletter_subscription",
            value: userData.preferences?.newsletter ? "true" : "false",
          },
          {
            key: "sms_updates",
            value: userData.preferences?.smsUpdates ? "true" : "false",
          },
        ],
      };

      const newCustomer = await createCustomer(customerData);

      // We slaan de WordPress users API registratie over omdat we al een gebruiker hebben aangemaakt via WooCommerce
      // WooCommerce maakt automatisch een WordPress gebruiker aan met dezelfde gegevens

      // Auto-login after successful registration
      const loginSuccess = await login(userData.email || "", userData.password);

      return loginSuccess;
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error.message ||
          "Registratie mislukt. Dit e-mailadres is mogelijk al in gebruik."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setOrders([]);
    localStorage.removeItem("wasgeurtje-user");
    localStorage.removeItem("wasgeurtje-token"); // Remove JWT token
    setError(null);
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is the admin user (Jack)
      if (user.email === "jack@goedkoop-bouwen.nl") {
        // Update local user state directly
        const updatedUser = {
          ...user,
          ...userData,
          // Ensure address is properly updated
          address: {
            street: userData.address?.street || user.address?.street || "",
            city: userData.address?.city || user.address?.city || "",
            postalCode:
              userData.address?.postalCode || user.address?.postalCode || "",
            country: userData.address?.country || user.address?.country || "NL",
          },
          preferences: {
            newsletter:
              userData.preferences?.newsletter !== undefined
                ? userData.preferences.newsletter
                : user.preferences?.newsletter || false,
            smsUpdates:
              userData.preferences?.smsUpdates !== undefined
                ? userData.preferences.smsUpdates
                : user.preferences?.smsUpdates || false,
          },
        };

        // Update addresses with new name if firstName or lastName changed
        if (
          (userData.firstName && userData.firstName !== user.firstName) ||
          (userData.lastName && userData.lastName !== user.lastName)
        ) {
          const newFirstName = userData.firstName || user.firstName;
          const newLastName = userData.lastName || user.lastName;

          if (updatedUser.addresses) {
            updatedUser.addresses = updatedUser.addresses.map((addr) => {
              // Only update if the address uses the user's default name
              if (!addr.firstName && !addr.lastName) {
                return {
                  ...addr,
                  firstName: newFirstName,
                  lastName: newLastName,
                };
              }
              // Or if the name matches the old user name
              else if (
                addr.firstName === user.firstName &&
                addr.lastName === user.lastName
              ) {
                return {
                  ...addr,
                  firstName: newFirstName,
                  lastName: newLastName,
                };
              }
              return addr;
            });
          }
        }

        setUser(updatedUser);
        localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

        return true;
      }

      // Regular flow for non-admin users - Update customer in WooCommerce
      const customerUpdateData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        billing: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          address_1: userData.address?.street,
          city: userData.address?.city,
          postcode: userData.address?.postalCode,
          country: userData.address?.country || "NL",
        },
        shipping: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          address_1: userData.address?.street,
          city: userData.address?.city,
          postcode: userData.address?.postalCode,
          country: userData.address?.country || "NL",
        },
        meta_data: [
          {
            key: "newsletter_subscription",
            value: userData.preferences?.newsletter ? "true" : "false",
          },
          {
            key: "sms_updates",
            value: userData.preferences?.smsUpdates ? "true" : "false",
          },
        ],
      };

      await updateCustomer(user.id, customerUpdateData);

      // Update local user state
      // After updating remote, refetch address to ensure local reflects backend
      let refreshedAddress = null as any;
      try {
        refreshedAddress = await fetchCustomerAddress(user.id);
      } catch {}

      const updatedUser = {
        ...user,
        ...userData,
        phone: refreshedAddress?.billing?.phone || userData.phone || user.phone,
        address: {
          street:
            refreshedAddress?.billing?.address_1 ||
            refreshedAddress?.shipping?.address_1 ||
            userData.address?.street ||
            user.address?.street ||
            "",
          city:
            refreshedAddress?.billing?.city ||
            refreshedAddress?.shipping?.city ||
            userData.address?.city ||
            user.address?.city ||
            "",
          postalCode:
            refreshedAddress?.billing?.postcode ||
            refreshedAddress?.shipping?.postcode ||
            userData.address?.postalCode ||
            user.address?.postalCode ||
            "",
          country:
            refreshedAddress?.billing?.country ||
            refreshedAddress?.shipping?.country ||
            userData.address?.country ||
            user.address?.country ||
            "NL",
        },
      } as User;

      // Update addresses with new name if firstName or lastName changed
      if (
        (userData.firstName && userData.firstName !== user.firstName) ||
        (userData.lastName && userData.lastName !== user.lastName)
      ) {
        const newFirstName = userData.firstName || user.firstName;
        const newLastName = userData.lastName || user.lastName;

        if (updatedUser.addresses) {
          updatedUser.addresses = updatedUser.addresses.map((addr) => {
            // Only update if the address uses the user's default name
            if (!addr.firstName && !addr.lastName) {
              return {
                ...addr,
                firstName: newFirstName,
                lastName: newLastName,
              };
            }
            // Or if the name matches the old user name
            else if (
              addr.firstName === user.firstName &&
              addr.lastName === user.lastName
            ) {
              return {
                ...addr,
                firstName: newFirstName,
                lastName: newLastName,
              };
            }
            return addr;
          });
        }
      }

      setUser(updatedUser);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message || "Profiel bijwerken mislukt.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrdersForUser = async (userId: string) => {
    try {
      // Fetch real orders from WooCommerce API using utility function
      const wcOrders = await fetchCustomerOrders(userId);

      if (!wcOrders || wcOrders.length === 0) {
        // Als er geen orders zijn, toon een lege array
        setOrders([]);
        return;
      }

      // Transform WooCommerce orders to our Order interface
      const transformedOrders: Order[] = wcOrders.map((wcOrder: any) => {
        // Bepaal de juiste billing en shipping informatie
        const billingName = wcOrder.billing
          ? `${wcOrder.billing.first_name || ""} ${
              wcOrder.billing.last_name || ""
            }`.trim()
          : "";

        const shippingName = wcOrder.shipping
          ? `${wcOrder.shipping.first_name || ""} ${
              wcOrder.shipping.last_name || ""
            }`.trim()
          : "";

        // Gebruik billing info als shipping leeg is
        const shippingStreet =
          wcOrder.shipping && wcOrder.shipping.address_1
            ? `${wcOrder.shipping.address_1 || ""} ${
                wcOrder.shipping.address_2 || ""
              }`.trim()
            : wcOrder.billing
            ? `${wcOrder.billing.address_1 || ""} ${
                wcOrder.billing.address_2 || ""
              }`.trim()
            : "";

        const shippingCity =
          wcOrder.shipping && wcOrder.shipping.city
            ? wcOrder.shipping.city
            : wcOrder.billing
            ? wcOrder.billing.city
            : "";

        const shippingPostcode =
          wcOrder.shipping && wcOrder.shipping.postcode
            ? wcOrder.shipping.postcode
            : wcOrder.billing
            ? wcOrder.billing.postcode
            : "";

        const shippingCountry =
          wcOrder.shipping && wcOrder.shipping.country
            ? wcOrder.shipping.country
            : wcOrder.billing
            ? wcOrder.billing.country
            : "NL";

        // Zoek tracking code in meta_data
        let trackingCode = "";
        if (Array.isArray(wcOrder.meta_data)) {
          const trackingMeta = wcOrder.meta_data.find(
            (meta: any) =>
              meta.key === "tracking_code" ||
              meta.key === "tracking_number" ||
              meta.key === "_tracking_number"
          );
          if (trackingMeta) trackingCode = trackingMeta.value;
        }

        return {
          id: wcOrder.id?.toString() || "",
          orderNumber:
            wcOrder.number ||
            `WG-${new Date().getFullYear()}-${wcOrder.id || "000"}`,
          date: wcOrder.date_created || new Date().toISOString(),
          status: mapWooCommerceStatus(wcOrder.status || "processing"),
          total:
            typeof wcOrder.total === "string"
              ? parseFloat(wcOrder.total)
              : wcOrder.total || 0,
          items: Array.isArray(wcOrder.line_items)
            ? wcOrder.line_items.map((item: any) => ({
                id: item.product_id?.toString() || "",
                name: item.name || "Wasparfum",
                quantity: item.quantity || 1,
                price:
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price || 0,
                image:
                  item.image?.src ||
                  "/figma/products/Wasgeurtje_Blossom_Drip.png",
              }))
            : [],
          shippingAddress: {
            name: shippingName || billingName,
            street: shippingStreet,
            city: shippingCity,
            postalCode: shippingPostcode,
            country: shippingCountry,
          },
          trackingCode: trackingCode,
        };
      });

      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching real orders:", error);
      // Bij fouten, toon een lege array
      setOrders([]);
    }
  };

  // Helper function to map WooCommerce order status to our status
  const mapWooCommerceStatus = (wcStatus: string): Order["status"] => {
    switch (wcStatus) {
      case "completed":
        return "delivered";
      case "processing":
        return "processing";
      case "on-hold":
        return "pending";
      case "cancelled":
        return "cancelled";
      case "refunded":
        return "cancelled";
      case "failed":
        return "cancelled";
      default:
        return "pending";
    }
  };

  const fetchLoyaltyPointsForUser = async (userId: string) => {
    try {
      // Always prefer using email-based endpoint if we have the user's email
      if (user && user.email) {
        console.log(
          `DEBUG: Using email-based loyalty endpoint for: ${user.email}`
        );
        const loyaltyData = await fetchLoyaltyPointsByEmail(user.email);

        if (loyaltyData) {
          // Update user with loyalty data
          setUser((prevUser) => {
            if (!prevUser) return null;

            return {
              ...prevUser,
              loyalty: {
                points: loyaltyData.points || 0,
                totalEarned: loyaltyData.total_earned || 0,
                rewardsAvailable: loyaltyData.rewards_available || 0,
                referCode: loyaltyData.refer_code || "",
                levelId: loyaltyData.level_id || "0",
              },
            };
          });
        }
        return;
      }

      // Fallback to customer ID based fetch for users without email
      const loyaltyData = await fetchCustomerLoyaltyPoints(userId);

      if (loyaltyData) {
        // Update user with loyalty data
        setUser((prevUser) => {
          if (!prevUser) return null;

          return {
            ...prevUser,
            loyalty: {
              points: loyaltyData.points || 0,
              totalEarned: loyaltyData.total_earned || 0,
              rewardsAvailable: loyaltyData.rewards_available || 0,
              referCode: loyaltyData.refer_code || "",
              levelId: loyaltyData.level_id || "0",
            },
          };
        });
      }
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (user) {
      await fetchOrdersForUser(user.id);
    }
  }, [user?.id]);

  // New direct email-based loyalty fetch function
  const fetchLoyaltyPointsByUserEmail = useCallback(
    async (email?: string) => {
      const targetEmail = email || user?.email;
      if (!targetEmail) {
        console.error("No email provided for loyalty points fetch");
        return;
      }

      try {
        console.log(
          `DEBUG: Fetching loyalty points directly by email: ${targetEmail}`
        );
        const loyaltyData = await fetchLoyaltyPointsByEmail(targetEmail);

        if (loyaltyData) {
          // Update user with loyalty data
          setUser((prevUser) => {
            if (!prevUser) return null;

            return {
              ...prevUser,
              loyalty: {
                points: loyaltyData.points || 0,
                totalEarned: loyaltyData.total_earned || 0,
                rewardsAvailable: loyaltyData.rewards_available || 0,
                referCode: loyaltyData.refer_code || "",
                levelId: loyaltyData.level_id || "0",
              },
            };
          });
        }
      } catch (error) {
        console.error("Error fetching loyalty points by email:", error);
      }
    },
    [user?.email]
  );

  const fetchLoyaltyPoints = useCallback(async () => {
    if (user) {
      await fetchLoyaltyPointsForUser(user.id);
    }
  }, [user?.id]);

  // Points redemption function
  const redeemPoints = useCallback(async (): Promise<RedeemResult> => {
    if (!user || !user.email) {
      return {
        success: false,
        error: "User not logged in or email not available",
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`DEBUG: Redeeming points for user: ${user.email}`);

      const response = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          points: user.loyalty?.points || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to redeem points");
        return {
          success: false,
          error: result.error || "Failed to redeem points",
        };
      }

      if (result.success) {
        // Update user's loyalty points immediately
        setUser((prevUser) => {
          if (!prevUser || !prevUser.loyalty) return prevUser;

          return {
            ...prevUser,
            loyalty: {
              ...prevUser.loyalty,
              points: result.remaining_points || prevUser.loyalty.points - 60,
            },
          };
        });

        // Also refresh loyalty points from server
        await fetchLoyaltyPointsByUserEmail(user.email);
      }

      return result;
    } catch (error) {
      console.error("Error redeeming points:", error);
      const errorMessage = "Network error during points redemption";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, user?.loyalty?.points, fetchLoyaltyPointsByUserEmail]);

  // Check redemption eligibility
  const checkRedeemEligibility = useCallback(async () => {
    if (!user || !user.email) {
      return {
        eligible: false,
        canRedeemTimes: 0,
        currentPoints: 0,
      };
    }

    try {
      const response = await fetch(
        `/api/loyalty/redeem?email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        return {
          eligible: false,
          canRedeemTimes: 0,
          currentPoints: user.loyalty?.points || 0,
        };
      }

      const result = await response.json();

      return {
        eligible: result.eligible || false,
        canRedeemTimes: result.can_redeem_times || 0,
        currentPoints: result.current_points || 0,
      };
    } catch (error) {
      console.error("Error checking redemption eligibility:", error);
      return {
        eligible: false,
        canRedeemTimes: 0,
        currentPoints: user.loyalty?.points || 0,
      };
    }
  }, [user?.email, user?.loyalty?.points]);

  const clearError = () => setError(null);

  // Address management functions
  const addAddress = async (address: Omit<Address, "id">): Promise<boolean> => {
    if (!user) return false;

    try {
      const newAddress: Address = {
        ...address,
        id: Date.now().toString(), // Generate unique ID
      };

      const updatedAddresses = [...(user.addresses || []), newAddress];
      const updatedUser = { ...user, addresses: updatedAddresses };

      setUser(updatedUser);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("Error adding address:", error);
      setError("Kon adres niet toevoegen");
      return false;
    }
  };

  const updateAddress = async (
    addressId: string,
    address: Partial<Address>
  ): Promise<boolean> => {
    if (!user || !user.addresses) return false;

    try {
      const updatedAddresses = user.addresses.map((addr) =>
        addr.id === addressId ? { ...addr, ...address } : addr
      );

      const updatedUser = { ...user, addresses: updatedAddresses };

      setUser(updatedUser);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("Error updating address:", error);
      setError("Kon adres niet bijwerken");
      return false;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    if (!user || !user.addresses) return false;

    try {
      const updatedAddresses = user.addresses.filter(
        (addr) => addr.id !== addressId
      );
      const updatedUser = { ...user, addresses: updatedAddresses };

      setUser(updatedUser);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("Error deleting address:", error);
      setError("Kon adres niet verwijderen");
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    if (!user || !user.addresses) return false;

    try {
      const updatedAddresses = user.addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));

      const updatedUser = { ...user, addresses: updatedAddresses };

      setUser(updatedUser);
      localStorage.setItem("wasgeurtje-user", JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("Error setting default address:", error);
      setError("Kon standaardadres niet instellen");
      return false;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(
        `https://wasgeurtje.nl/wp-json/wasgeurtje/v1/resetpassword`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        return {
          success: true,
          message:
            data.message || "Password reset link has been sent to your email.",
        };
      } else {
        return {
          success: false,
          message:
            data?.message ||
            data?.error ||
            "Failed to send password reset email.",
        };
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await fetch(
        `https://wasgeurtje.nl/wp-json/wasgeurtje/v1/resetpassword`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || "Password has been reset successfully.",
        };
      } else {
        return {
          success: false,
          message: data?.message || data?.error || "Failed to reset password.",
        };
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        isLoading,
        isLoggedIn: !!user,
        isAdmin:
          user?.role === "administrator" ||
          user?.email === "admin@wasgeurtje.nl",
        sessionRestored,
        login,
        register,
        logout,
        updateProfile,
        fetchOrders,
        fetchLoyaltyPoints,
        fetchLoyaltyPointsByUserEmail,
        redeemPoints,
        checkRedeemEligibility,
        error,
        clearError,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        forgotPassword,
        resetPassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
