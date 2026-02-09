import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface DeliveryStep {
  lat: number;
  lng: number;
  status: OrderStatus;
  message: string;
}

/**
 * Generates a random location within specified distance (in km) from origin
 */
const generateNearbyLocation = (
  originLat: number,
  originLng: number,
  maxDistanceKm: number = 1
): { lat: number; lng: number } => {
  // Random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * maxDistanceKm;
  
  // Convert km to degrees (approximate)
  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(originLat * Math.PI / 180));
  
  return {
    lat: originLat + latOffset,
    lng: originLng + lngOffset,
  };
};

/**
 * Generates delivery path from restaurant to customer
 */
/**
 * Generates STRAIGHT LINE delivery path from restaurant to customer
 */
const generateDeliveryPath = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numSteps: number = 12
): DeliveryStep[] => {
  const steps: DeliveryStep[] = [];
  
  for (let i = 0; i <= numSteps; i++) {
    const progress = i / numSteps;
    
    // STRAIGHT LINE - no curve, direct path from restaurant to home
    const lat = startLat + (endLat - startLat) * progress;
    const lng = startLng + (endLng - startLng) * progress;
    
    // Determine status based on progress
    let status: OrderStatus;
    let message: string;
    
    if (progress < 0.1) {
      status = "picked_up";
      message = "Delivery partner picked up your order";
    } else if (progress < 0.6) {
      status = "on_the_way";
      message = "On the way to your location";
    } else if (progress < 0.95) {
      status = "arriving";
      message = "Almost there! Arriving soon";
    } else {
      status = "delivered";
      message = "Order delivered! Enjoy your meal";
    }
    
    steps.push({ lat, lng, status, message });
  }
  
  return steps;
};

/**
 * Hook that automatically handles delivery simulation when an order is placed
 * - Auto-assigns a delivery partner
 * - Generates delivery location within 1km if not set
 * - Completes delivery within 1 minute
 */
export const useAutoDelivery = (orderId: string | undefined) => {
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!orderId || isRunningRef.current) return;

    const startAutoDelivery = async () => {
      try {
        // Check if order exists and is in valid status
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*, restaurants(latitude, longitude)")
          .eq("id", orderId)
          .single();

        if (orderError || !order) {
          console.log("Order not found:", orderId);
          return;
        }

        // Only start for newly placed orders
        if (order.status !== "placed") {
          return;
        }

        isRunningRef.current = true;

        // Get restaurant coordinates (default to Vellore)
        const restaurant = order.restaurants as { latitude: number | null; longitude: number | null } | null;
        const restaurantLat = restaurant?.latitude || 12.9165;
        const restaurantLng = restaurant?.longitude || 79.1325;

        // Get or generate customer delivery location
        let customerLat = order.delivery_latitude;
        let customerLng = order.delivery_longitude;

        // If no delivery coordinates, generate random location within 1km
        if (!customerLat || !customerLng) {
          const nearbyLocation = generateNearbyLocation(restaurantLat, restaurantLng, 1);
          customerLat = nearbyLocation.lat;
          customerLng = nearbyLocation.lng;

          // Update order with generated coordinates
          await supabase
            .from("orders")
            .update({
              delivery_latitude: customerLat,
              delivery_longitude: customerLng,
            })
            .eq("id", orderId);
        }

        // Get an available delivery partner
        const { data: partners } = await supabase
          .from("delivery_partners")
          .select("id, name")
          .eq("is_available", true)
          .limit(1);

        const partnerId = partners?.[0]?.id || null;
        const partnerName = partners?.[0]?.name || "Delivery Partner";

        // Create or update order tracking
        const { data: existingTracking } = await supabase
          .from("order_tracking")
          .select("id")
          .eq("order_id", orderId)
          .single();

        if (existingTracking) {
          await supabase
            .from("order_tracking")
            .update({
              delivery_partner_id: partnerId,
              current_latitude: restaurantLat,
              current_longitude: restaurantLng,
              status: "confirmed",
              status_message: "Restaurant confirmed your order",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingTracking.id);
        } else {
          await supabase.from("order_tracking").insert({
            order_id: orderId,
            delivery_partner_id: partnerId,
            current_latitude: restaurantLat,
            current_longitude: restaurantLng,
            status: "confirmed",
            status_message: "Restaurant confirmed your order",
          });
        }

        // Update order status to confirmed
        await supabase
          .from("orders")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        toast.success(`${partnerName} assigned to your order!`);

        // Generate delivery path
        const deliverySteps = generateDeliveryPath(
          restaurantLat,
          restaurantLng,
          customerLat,
          customerLng,
          12
        );

        // Simulate delivery in ~2 minutes (10 seconds per step)
        const STEP_INTERVAL = 10000; // 10 seconds per step
        let currentStep = 0;

        // Initial preparing phase
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await supabase
          .from("order_tracking")
          .update({
            status: "preparing",
            status_message: "Chef is preparing your food",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        await supabase
          .from("orders")
          .update({ status: "preparing", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        // Ready for pickup after 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        await supabase
          .from("order_tracking")
          .update({
            status: "ready_for_pickup",
            status_message: "Order ready for pickup",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        await supabase
          .from("orders")
          .update({ status: "ready_for_pickup", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        // Start delivery simulation
        simulationRef.current = setInterval(async () => {
          if (currentStep >= deliverySteps.length) {
            if (simulationRef.current) {
              clearInterval(simulationRef.current);
              simulationRef.current = null;
            }
            isRunningRef.current = false;
            return;
          }

          const step = deliverySteps[currentStep];

          // Update tracking location and status
          await supabase
            .from("order_tracking")
            .update({
              current_latitude: step.lat,
              current_longitude: step.lng,
              status: step.status,
              status_message: step.message,
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId);

          // Update order status
          await supabase
            .from("orders")
            .update({
              status: step.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          // Show toast for final delivery
          if (step.status === "delivered") {
            toast.success("🎉 Your order has been delivered!");
          }

          currentStep++;
        }, STEP_INTERVAL);

      } catch (error) {
        console.error("Auto delivery error:", error);
        isRunningRef.current = false;
      }
    };

    // Small delay to ensure order is fully created
    const timeout = setTimeout(startAutoDelivery, 1500);

    return () => {
      clearTimeout(timeout);
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, [orderId]);

  return null;
};
