import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });
};

export const useFavoriteRestaurants = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite_restaurants", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          restaurant_id,
          restaurants (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useIsFavorite = (restaurantId: string) => {
  const { data: favorites } = useFavorites();
  return favorites?.some(fav => fav.restaurant_id === restaurantId) ?? false;
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, isFavorite }: { restaurantId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("Must be logged in to favorite restaurants");

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId);

        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId,
          });

        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite_restaurants"] });
      toast.success(result.action === "added" ? "Added to favorites!" : "Removed from favorites");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
