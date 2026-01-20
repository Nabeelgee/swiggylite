import React, { createContext, useContext, useState, useCallback } from "react";
import { CartItem, MenuItem } from "@/types";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  currentRestaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);

  const addItem = useCallback((item: MenuItem, restaurantId: string, restaurantName: string) => {
    setItems((prevItems) => {
      // Check if adding from a different restaurant
      if (currentRestaurantId && currentRestaurantId !== restaurantId && prevItems.length > 0) {
        toast.error("Please clear your cart before ordering from another restaurant");
        return prevItems;
      }

      const existingItem = prevItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        toast.success(`Added another ${item.name} to cart`);
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      setCurrentRestaurantId(restaurantId);
      toast.success(`${item.name} added to cart`);
      return [...prevItems, { ...item, quantity: 1, restaurantId, restaurantName }];
    });
  }, [currentRestaurantId]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((i) => i.id !== itemId);
      if (newItems.length === 0) {
        setCurrentRestaurantId(null);
      }
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setCurrentRestaurantId(null);
    toast.success("Cart cleared");
  }, []);

  const getItemQuantity = useCallback((itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getTotalItems,
        getTotalPrice,
        currentRestaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
