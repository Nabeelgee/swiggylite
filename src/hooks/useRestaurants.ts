import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("is_promoted", { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
  });
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
  return useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
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
  });
};
