import { useEffect, useState, useCallback } from "react";

const CACHE_KEYS = {
  RESTAURANTS: "quickbite_restaurants_cache",
  MENU_ITEMS: "quickbite_menu_items_cache",
  ORDERS: "quickbite_orders_cache",
  FAVORITES: "quickbite_favorites_cache",
  LAST_SYNC: "quickbite_last_sync",
};

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load last sync time
    const savedSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    if (savedSync) {
      setLastSync(new Date(parseInt(savedSync)));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveToCache = useCallback(<T,>(key: string, data: T): void => {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
      setLastSync(new Date());
    } catch (error) {
      console.warn("Failed to save to cache:", error);
    }
  }, []);

  const getFromCache = useCallback(<T,>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const parsedCache: CachedData<T> = JSON.parse(cached);
      return parsedCache.data;
    } catch (error) {
      console.warn("Failed to read from cache:", error);
      return null;
    }
  }, []);

  const clearCache = useCallback((): void => {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    setLastSync(null);
  }, []);

  // Cache restaurants
  const cacheRestaurants = useCallback(
    (restaurants: any[]) => {
      saveToCache(CACHE_KEYS.RESTAURANTS, restaurants);
    },
    [saveToCache]
  );

  const getCachedRestaurants = useCallback((): any[] | null => {
    return getFromCache(CACHE_KEYS.RESTAURANTS);
  }, [getFromCache]);

  // Cache menu items
  const cacheMenuItems = useCallback(
    (restaurantId: string, items: any[]) => {
      const allMenuItems = getFromCache<Record<string, any[]>>(CACHE_KEYS.MENU_ITEMS) || {};
      allMenuItems[restaurantId] = items;
      saveToCache(CACHE_KEYS.MENU_ITEMS, allMenuItems);
    },
    [getFromCache, saveToCache]
  );

  const getCachedMenuItems = useCallback(
    (restaurantId: string): any[] | null => {
      const allMenuItems = getFromCache<Record<string, any[]>>(CACHE_KEYS.MENU_ITEMS);
      return allMenuItems?.[restaurantId] || null;
    },
    [getFromCache]
  );

  // Cache orders
  const cacheOrders = useCallback(
    (orders: any[]) => {
      saveToCache(CACHE_KEYS.ORDERS, orders);
    },
    [saveToCache]
  );

  const getCachedOrders = useCallback((): any[] | null => {
    return getFromCache(CACHE_KEYS.ORDERS);
  }, [getFromCache]);

  return {
    isOnline,
    lastSync,
    cacheRestaurants,
    getCachedRestaurants,
    cacheMenuItems,
    getCachedMenuItems,
    cacheOrders,
    getCachedOrders,
    clearCache,
  };
};

export default useOfflineStorage;
