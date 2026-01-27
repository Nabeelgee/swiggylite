import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useOfflineStorage } from "./useOfflineStorage";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  restaurant_name: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number | null;
  platform_fee: number | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  special_instructions: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
  is_veg: boolean | null;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  delivery_partner_id: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  status: OrderStatus;
  status_message: string | null;
  updated_at: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

export const useOrders = () => {
  const { user } = useAuth();
  const { isOnline, cacheOrders, getCachedOrders } = useOfflineStorage();

  const query = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      // If offline, return cached data
      if (!isOnline) {
        const cached = getCachedOrders();
        if (cached) return cached as Order[];
        throw new Error("No cached orders available");
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
    staleTime: isOnline ? 1000 * 60 * 2 : Infinity, // 2 minutes when online
  });

  // Cache orders when online
  useEffect(() => {
    if (isOnline && query.data) {
      cacheOrders(query.data);
    }
  }, [isOnline, query.data, cacheOrders]);

  return query;
};

export const useOrder = (orderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!user && !!orderId,
  });
};

export const useOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: ["order_items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
};

export const useOrderTracking = (orderId: string) => {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Initial fetch
    const fetchTracking = async () => {
      const { data: trackingData } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (trackingData) {
        setTracking(trackingData as OrderTracking);

        if (trackingData.delivery_partner_id) {
          const { data: partnerData } = await supabase
            .from("delivery_partners")
            .select("*")
            .eq("id", trackingData.delivery_partner_id)
            .maybeSingle();

          if (partnerData) {
            setPartner(partnerData as DeliveryPartner);
          }
        }
      }
    };

    fetchTracking();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order_tracking:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            setTracking(payload.new as OrderTracking);
            toast.info("Order status updated!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { tracking, partner };
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      restaurantName,
      items,
      totalAmount,
      deliveryFee,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      specialInstructions,
    }: {
      restaurantId: string;
      restaurantName: string;
      items: Array<{
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
        isVeg: boolean;
      }>;
      totalAmount: number;
      deliveryFee: number;
      deliveryAddress: string;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
      specialInstructions?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate UUID format - if restaurantId is not a valid UUID, set to null
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const validRestaurantId = isValidUUID(restaurantId) ? restaurantId : null;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          restaurant_id: validRestaurantId,
          restaurant_name: restaurantName,
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          delivery_address: deliveryAddress,
          delivery_latitude: deliveryLatitude,
          delivery_longitude: deliveryLongitude,
          special_instructions: specialInstructions,
          estimated_delivery_time: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items - only include menu_item_id if it's a valid UUID
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: isValidUUID(item.menuItemId) ? item.menuItemId : null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        is_veg: item.isVeg,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to place order: ${error.message}`);
    },
  });
};
