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
    
    // Add slight curve for realistic path
    const curve = Math.sin(progress * Math.PI) * 0.0005;
    
    const lat = startLat + (endLat - startLat) * progress + curve;
    const lng = startLng + (endLng - startLng) * progress + curve * 0.5;
    
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
          .select("*, restaurants(latitude, longitude, name)")
          .eq("id", orderId)
          .single();

        if (orderError || !order) {
          console.log("Order not found:", orderId);
          return;
        }

        // Only start for newly placed orders
        if (order.status !== "placed") {
          console.log("Order not in placed status:", order.status);
          return;
        }

        isRunningRef.current = true;
        console.log("🚀 Starting auto-delivery for order:", orderId);

        // Get restaurant coordinates (default to Koramangala if not set)
        const restaurant = order.restaurants as { latitude: number | null; longitude: number | null; name: string } | null;
        const restaurantLat = restaurant?.latitude || 12.9352;
        const restaurantLng = restaurant?.longitude || 77.6245;

        console.log("📍 Restaurant location:", { lat: restaurantLat, lng: restaurantLng });

        // Get or generate customer delivery location (within 1km of restaurant)
        let customerLat = order.delivery_latitude;
        let customerLng = order.delivery_longitude;

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
          
          console.log("📍 Generated customer location:", { lat: customerLat, lng: customerLng });
        } else {
          console.log("📍 Using existing customer location:", { lat: customerLat, lng: customerLng });
        }

        // Get an available delivery partner
        const { data: partners } = await supabase
          .from("delivery_partners")
          .select("id, name")
          .eq("is_available", true)
          .limit(1);

        const partnerId = partners?.[0]?.id || null;
        const partnerName = partners?.[0]?.name || "Delivery Partner";

        // Delete existing tracking and create fresh one starting at restaurant
        await supabase
          .from("order_tracking")
          .delete()
          .eq("order_id", orderId);

        // Create new tracking record at RESTAURANT location
        await supabase.from("order_tracking").insert({
          order_id: orderId,
          delivery_partner_id: partnerId,
          current_latitude: restaurantLat,
          current_longitude: restaurantLng,
          status: "confirmed",
          status_message: "Restaurant confirmed your order",
        });

        // Update order status to confirmed
        await supabase
          .from("orders")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        toast.success(`${partnerName} assigned to your order!`);

        // Phase 1: Preparing (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await supabase
          .from("order_tracking")
          .update({
            status: "preparing",
            status_message: "Chef is preparing your food",
            current_latitude: restaurantLat,
            current_longitude: restaurantLng,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        await supabase
          .from("orders")
          .update({ status: "preparing", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        console.log("👨‍🍳 Status: Preparing");

        // Phase 2: Ready for pickup (3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000));

        await supabase
          .from("order_tracking")
          .update({
            status: "ready_for_pickup",
            status_message: "Order ready! Partner picking up",
            current_latitude: restaurantLat,
            current_longitude: restaurantLng,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        await supabase
          .from("orders")
          .update({ status: "ready_for_pickup", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        console.log("✅ Status: Ready for pickup");

        // Generate delivery path FROM RESTAURANT TO CUSTOMER
        const deliverySteps = generateDeliveryPath(
          restaurantLat,
          restaurantLng,
          customerLat,
          customerLng,
          10 // 10 steps for ~50 second delivery (5s each)
        );

        console.log("🛣️ Delivery path generated:", deliverySteps.length, "steps");

        // Phase 3: Delivery simulation - partner moves from restaurant to customer
        let currentStep = 0;
        const STEP_INTERVAL = 5000; // 5 seconds per step

        simulationRef.current = setInterval(async () => {
          if (currentStep >= deliverySteps.length) {
            if (simulationRef.current) {
              clearInterval(simulationRef.current);
              simulationRef.current = null;
            }
            isRunningRef.current = false;
            console.log("🏁 Delivery simulation complete!");
            return;
          }

          const step = deliverySteps[currentStep];

          console.log(`📦 Step ${currentStep + 1}/${deliverySteps.length}:`, {
            status: step.status,
            lat: step.lat.toFixed(5),
            lng: step.lng.toFixed(5),
          });

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

    // Start after 1.5 seconds to ensure order is fully created
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
