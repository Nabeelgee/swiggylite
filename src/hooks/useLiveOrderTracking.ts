import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface LiveTracking {
  id: string;
  order_id: string;
  delivery_partner_id: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  status: OrderStatus;
  status_message: string | null;
  updated_at: string;
}

export interface LiveDeliveryPartner {
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

/**
 * Enhanced real-time order tracking hook with live location updates
 * Subscribes to both order_tracking and delivery_partners tables for live updates
 */
export const useLiveOrderTracking = (orderId: string) => {
  const [tracking, setTracking] = useState<LiveTracking | null>(null);
  const [partner, setPartner] = useState<LiveDeliveryPartner | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  // Fetch partner data
  const fetchPartner = useCallback(async (partnerId: string) => {
    const { data, error } = await supabase
      .from("delivery_partners")
      .select("*")
      .eq("id", partnerId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching partner:", error);
      return;
    }

    if (data) {
      setPartner(data as LiveDeliveryPartner);
    }
  }, []);

  // Initial fetch and subscription setup
  useEffect(() => {
    if (!orderId) return;

    let trackingChannel: ReturnType<typeof supabase.channel> | null = null;
    let partnerChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscriptions = async () => {
      // Initial fetch
      const { data: trackingData, error } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tracking:", error);
        return;
      }

      if (trackingData) {
        setTracking(trackingData as LiveTracking);
        setLastUpdate(new Date());

        if (trackingData.delivery_partner_id) {
          await fetchPartner(trackingData.delivery_partner_id);

          // Subscribe to delivery partner location updates
          partnerChannel = supabase
            .channel(`partner_location:${trackingData.delivery_partner_id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "delivery_partners",
                filter: `id=eq.${trackingData.delivery_partner_id}`,
              },
              (payload) => {
                if (payload.new) {
                  setPartner(payload.new as LiveDeliveryPartner);
                  setLastUpdate(new Date());
                }
              }
            )
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log("Subscribed to partner location updates");
              }
            });
        }
      }

      // Subscribe to order tracking updates
      trackingChannel = supabase
        .channel(`live_tracking:${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "order_tracking",
            filter: `order_id=eq.${orderId}`,
          },
          async (payload) => {
            if (payload.new) {
              const newTracking = payload.new as LiveTracking;
              setTracking(newTracking);
              setLastUpdate(new Date());

              // Update order status in cache
              queryClient.setQueryData(["order", orderId], (old: any) => {
                if (old) {
                  return { ...old, status: newTracking.status };
                }
                return old;
              });

              // Show toast for status changes
              if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
                const statusMessages: Record<OrderStatus, string> = {
                  placed: "Order placed!",
                  confirmed: "Restaurant confirmed your order!",
                  preparing: "Your food is being prepared!",
                  ready_for_pickup: "Your order is ready for pickup!",
                  picked_up: "Delivery partner picked up your order!",
                  on_the_way: "Your order is on the way!",
                  arriving: "Your order is arriving soon!",
                  delivered: "Order delivered! Enjoy your meal!",
                  cancelled: "Order has been cancelled",
                };

                toast.success(statusMessages[newTracking.status] || "Order updated!", {
                  duration: 4000,
                });
              }

              // If partner changed, fetch new partner data
              if (
                newTracking.delivery_partner_id &&
                newTracking.delivery_partner_id !== partner?.id
              ) {
                await fetchPartner(newTracking.delivery_partner_id);
              }
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") {
            console.log("Subscribed to order tracking updates");
          }
        });
    };

    setupSubscriptions();

    return () => {
      if (trackingChannel) {
        supabase.removeChannel(trackingChannel);
      }
      if (partnerChannel) {
        supabase.removeChannel(partnerChannel);
      }
    };
  }, [orderId, fetchPartner, queryClient, partner?.id]);

  // Compute live partner location (prefer real-time from tracking, fallback to partner table)
  const partnerLocation = tracking?.current_latitude && tracking?.current_longitude
    ? { lat: tracking.current_latitude, lng: tracking.current_longitude }
    : partner?.current_latitude && partner?.current_longitude
    ? { lat: partner.current_latitude, lng: partner.current_longitude }
    : null;

  return {
    tracking,
    partner,
    partnerLocation,
    isConnected,
    lastUpdate,
  };
};
