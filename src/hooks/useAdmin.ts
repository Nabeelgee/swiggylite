import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user,
  });
};

export const useAllRestaurants = () => {
  return useQuery({
    queryKey: ["admin_restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAllMenuItems = (restaurantId?: string) => {
  return useQuery({
    queryKey: ["admin_menu_items", restaurantId],
    queryFn: async () => {
      let query = supabase.from("menu_items").select("*");
      
      if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAllOrders = () => {
  return useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Restaurant mutations
export const useCreateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: {
      name: string;
      address?: string;
      cuisines?: string[];
      cost_for_two?: string;
      delivery_time?: string;
      image_url?: string;
      is_veg?: boolean;
      rating?: number;
      discount?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const { data, error } = await supabase
        .from("restaurants")
        .insert(restaurant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name: string;
      address: string;
      cuisines: string[];
      cost_for_two: string;
      delivery_time: string;
      image_url: string;
      is_veg: boolean;
      is_active: boolean;
      rating: number;
      discount: string;
      latitude: number;
      longitude: number;
    }>) => {
      const { data, error } = await supabase
        .from("restaurants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Menu item mutations
export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      restaurant_id: string;
      name: string;
      description?: string;
      price: number;
      category: string;
      image_url?: string;
      is_veg?: boolean;
      is_bestseller?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Menu item created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      image_url: string;
      is_veg: boolean;
      is_bestseller: boolean;
      is_available: boolean;
    }>) => {
      const { data, error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Menu item updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Menu item deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Order mutations
type OrderStatus = "placed" | "confirmed" | "preparing" | "ready_for_pickup" | "picked_up" | "on_the_way" | "arriving" | "delivered" | "cancelled";

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // First delete related order_items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Delete related order_tracking
      const { error: trackingError } = await supabase
        .from("order_tracking")
        .delete()
        .eq("order_id", orderId);

      if (trackingError) throw trackingError;

      // Delete related order_messages
      const { error: messagesError } = await supabase
        .from("order_messages")
        .delete()
        .eq("order_id", orderId);

      if (messagesError) throw messagesError;

      // Finally delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
