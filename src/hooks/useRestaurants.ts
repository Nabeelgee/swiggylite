import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineStorage } from "./useOfflineStorage";
import { useEffect } from "react";

export interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number | null;
  delivery_time: string | null;
  cuisines: string[] | null;
  cost_for_two: string | null;
  discount: string | null;
  is_veg: boolean | null;
  is_promoted: boolean | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean | null;
  is_bestseller: boolean | null;
  category: string;
  is_available: boolean | null;
}

export const useRestaurants = () => {
  const { isOnline, cacheRestaurants, getCachedRestaurants } = useOfflineStorage();

  const query = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      // If offline, return cached data
      if (!isOnline) {
        const cached = getCachedRestaurants();
        if (cached) return cached as Restaurant[];
        throw new Error("No cached data available");
      }

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("is_promoted", { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
    staleTime: isOnline ? 1000 * 60 * 5 : Infinity, // 5 minutes when online, infinite when offline
  });

  // Cache data when online and data is available
  useEffect(() => {
    if (isOnline && query.data) {
      cacheRestaurants(query.data);
    }
  }, [isOnline, query.data, cacheRestaurants]);

  return query;
};

export const useRestaurant = (id: string) => {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Restaurant | null;
    },
    enabled: !!id,
  });
};

export const useMenuItems = (restaurantId: string) => {
  const { isOnline, cacheMenuItems, getCachedMenuItems } = useOfflineStorage();

  const query = useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
      // If offline, return cached data
      if (!isOnline) {
        const cached = getCachedMenuItems(restaurantId);
        if (cached) return cached as MenuItem[];
        throw new Error("No cached menu data available");
      }

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true)
        .order("is_bestseller", { ascending: false });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurantId,
    staleTime: isOnline ? 1000 * 60 * 5 : Infinity,
  });

  // Cache menu items when online
  useEffect(() => {
    if (isOnline && query.data) {
      cacheMenuItems(restaurantId, query.data);
    }
  }, [isOnline, query.data, restaurantId, cacheMenuItems]);

  return query;
};
