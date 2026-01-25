import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | null;
  is_available: boolean | null;
  current_latitude: number | null;
  current_longitude: number | null;
  avatar_url: string | null;
  created_at: string;
}

// Fetch all available delivery partners
export const useDeliveryPartners = () => {
  return useQuery({
    queryKey: ["delivery_partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as DeliveryPartner[];
    },
  });
};

// Fetch available partners only
export const useAvailableDeliveryPartners = () => {
  return useQuery({
    queryKey: ["available_delivery_partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .eq("is_available", true)
        .order("name");

      if (error) throw error;
      return data as DeliveryPartner[];
    },
  });
};

// Assign a delivery partner to an order
export const useAssignDeliveryPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      partnerId,
      restaurantLat = 12.9352,
      restaurantLng = 77.6245,
    }: {
      orderId: string;
      partnerId: string;
      restaurantLat?: number;
      restaurantLng?: number;
    }) => {
      // First, get the partner's current location or use restaurant location
      const { data: partner, error: partnerError } = await supabase
        .from("delivery_partners")
        .select("current_latitude, current_longitude")
        .eq("id", partnerId)
        .single();

      if (partnerError) throw partnerError;

      // Use partner's location if available, otherwise use restaurant location
      const startLat = partner.current_latitude || restaurantLat;
      const startLng = partner.current_longitude || restaurantLng;

      // Check if order_tracking already exists
      const { data: existingTracking } = await supabase
        .from("order_tracking")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingTracking) {
        // Update existing tracking
        const { data, error } = await supabase
          .from("order_tracking")
          .update({
            delivery_partner_id: partnerId,
            current_latitude: startLat,
            current_longitude: startLng,
            status: "confirmed" as OrderStatus,
            status_message: "Delivery partner assigned",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new tracking row
        const { data, error } = await supabase
          .from("order_tracking")
          .insert({
            order_id: orderId,
            delivery_partner_id: partnerId,
            current_latitude: startLat,
            current_longitude: startLng,
            status: "confirmed" as OrderStatus,
            status_message: "Delivery partner assigned",
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["order_tracking"] });
      queryClient.invalidateQueries({ queryKey: ["available_delivery_partners"] });
      toast.success("Delivery partner assigned successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign partner: ${error.message}`);
    },
  });
};

// Get order tracking with partner info
export const useOrderTrackingInfo = (orderId: string) => {
  return useQuery({
    queryKey: ["order_tracking_info", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_tracking")
        .select(`
          *,
          delivery_partners (*)
        `)
        .eq("order_id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
};
