"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  originalPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (item: Omit<CartItem, "quantity"> | CartItem) => void;
  removeFromCart: (id: string, variant?: string) => void;
  updateQuantity: (
    id: string,
    variant: string | undefined,
    quantity: number
  ) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  cartCount: number;
  subtotal: number;
  shippingThreshold: number;
  freeShippingAmount: number;
  remainingForFreeShipping: number;
  hasReachedFreeShipping: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 40; // €40 voor gratis verzending

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("wasgeurtje-cart");
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wasgeurtje-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, "quantity"> | CartItem) => {
    // Bewaar huidige scroll positie
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    const quantityToAdd = "quantity" in item ? item.quantity : 1;

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (i) => i.id === item.id && i.variant === item.variant
      );

      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id && i.variant === item.variant
            ? { ...i, quantity: i.quantity + quantityToAdd }
            : i
        );
      }

      return [...currentItems, { ...item, quantity: quantityToAdd }];
    });

    // Open cart when item is added
    setIsOpen(true);

    // Herstel de scroll positie na een korte vertraging (zodat de sidebar eerst kan openen)
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: "auto", // 'auto' in plaats van 'smooth' om sprong te voorkomen
      });
    }, 50);
  };

  const removeFromCart = (id: string, variant?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.id === id && item.variant === variant)
      )
    );
  };

  const updateQuantity = (
    id: string,
    variant: string | undefined,
    quantity: number
  ) => {
    if (quantity < 1) {
      removeFromCart(id, variant);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.variant === variant
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(!isOpen);

  // Calculate derived values
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );
  const hasReachedFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        cartCount,
        subtotal,
        shippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingAmount: FREE_SHIPPING_THRESHOLD,
        remainingForFreeShipping,
        hasReachedFreeShipping,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
