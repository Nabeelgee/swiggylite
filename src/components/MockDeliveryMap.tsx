import React, { useEffect, useState, useRef } from "react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface MockDeliveryMapProps {
  restaurantLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  deliveryPartnerLocation?: { lat: number; lng: number };
  restaurantName?: string;
  deliveryAddress?: string;
  partnerName?: string;
  orderStatus?: OrderStatus;
  eta?: { distance: string; duration: string } | null;
}

// Convert lat/lng to percentage position on map (simplified projection)
const latLngToPercent = (
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) => {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
};

const MockDeliveryMap: React.FC<MockDeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  deliveryPartnerLocation,
  restaurantName = "Restaurant",
  deliveryAddress = "Delivery Address",
  partnerName = "Delivery Partner",
  orderStatus,
  eta,
}) => {
  const [animatedPartner, setAnimatedPartner] = useState(deliveryPartnerLocation);
  const previousPosRef = useRef(deliveryPartnerLocation);
  const animationRef = useRef<number>();

  // Smooth animation for partner movement
  useEffect(() => {
    if (!deliveryPartnerLocation) return;

    const prevPos = previousPosRef.current;
    if (!prevPos) {
      setAnimatedPartner(deliveryPartnerLocation);
      previousPosRef.current = deliveryPartnerLocation;
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setAnimatedPartner({
        lat: prevPos.lat + (deliveryPartnerLocation.lat - prevPos.lat) * eased,
        lng: prevPos.lng + (deliveryPartnerLocation.lng - prevPos.lng) * eased,
      });

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousPosRef.current = deliveryPartnerLocation;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [deliveryPartnerLocation]);

  // Calculate bounds for positioning
  const allPoints = [restaurantLocation, deliveryLocation, animatedPartner].filter(Boolean) as { lat: number; lng: number }[];
  
  const bounds = allPoints.length > 0 ? {
    minLat: Math.min(...allPoints.map(p => p.lat)) - 0.01,
    maxLat: Math.max(...allPoints.map(p => p.lat)) + 0.01,
    minLng: Math.min(...allPoints.map(p => p.lng)) - 0.01,
    maxLng: Math.max(...allPoints.map(p => p.lng)) + 0.01,
  } : {
    minLat: 12.92,
    maxLat: 12.95,
    minLng: 77.61,
    maxLng: 77.64,
  };

  const restaurantPos = restaurantLocation ? latLngToPercent(restaurantLocation.lat, restaurantLocation.lng, bounds) : null;
  const deliveryPos = deliveryLocation ? latLngToPercent(deliveryLocation.lat, deliveryLocation.lng, bounds) : null;
  const partnerPos = animatedPartner ? latLngToPercent(animatedPartner.lat, animatedPartner.lng, bounds) : null;

  const getStatusColor = () => {
    switch (orderStatus) {
      case "picked_up": return "text-green-600";
      case "on_the_way": return "text-primary";
      case "arriving": return "text-primary";
      case "delivered": return "text-green-600";
      default: return "text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case "picked_up": return "Order Picked Up";
      case "on_the_way": return "On the Way";
      case "arriving": return "Almost There!";
      case "delivered": return "Delivered";
      case "preparing": return "Preparing";
      case "confirmed": return "Confirmed";
      default: return "Tracking";
    }
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-green-100 via-green-50 to-blue-50 dark:from-green-900/20 dark:via-background dark:to-blue-900/20">
      {/* Grid pattern for map effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Curved road effect */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Background roads */}
        <path
          d="M 10 30 Q 30 50 50 40 T 90 60"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M 20 70 Q 40 50 60 65 T 95 45"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />

        {/* Main route line */}
        {restaurantPos && deliveryPos && (
          <path
            d={`M ${restaurantPos.x} ${restaurantPos.y} ${partnerPos ? `Q ${(restaurantPos.x + deliveryPos.x) / 2} ${Math.min(restaurantPos.y, deliveryPos.y) - 10} ${partnerPos.x} ${partnerPos.y} T` : "L"} ${deliveryPos.x} ${deliveryPos.y}`}
            stroke="hsl(var(--primary))"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray={orderStatus === "on_the_way" ? "none" : "2 2"}
            className="transition-all duration-500"
          />
        )}

        {/* Progress indicator (traveled path) */}
        {restaurantPos && partnerPos && (
          <path
            d={`M ${restaurantPos.x} ${restaurantPos.y} L ${partnerPos.x} ${partnerPos.y}`}
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Restaurant marker */}
      {restaurantPos && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
          style={{ left: `${restaurantPos.x}%`, top: `${restaurantPos.y}%` }}
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xl transition-transform group-hover:scale-110">
            🍔
          </div>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded shadow text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {restaurantName}
          </div>
        </div>
      )}

      {/* Delivery partner marker */}
      {partnerPos && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer transition-all duration-300"
          style={{ left: `${partnerPos.x}%`, top: `${partnerPos.y}%` }}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-3 border-white text-2xl transition-transform group-hover:scale-110 ${
            orderStatus === "on_the_way" || orderStatus === "picked_up" ? "bg-green-500 animate-pulse" : "bg-green-500"
          }`}>
            🛵
          </div>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded shadow text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {partnerName}
          </div>
          {/* Motion trail */}
          {(orderStatus === "on_the_way" || orderStatus === "picked_up") && (
            <>
              <div className="absolute w-8 h-8 bg-green-400/30 rounded-full -z-10 animate-ping" />
              <div className="absolute w-6 h-6 bg-green-400/50 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 animate-pulse" />
            </>
          )}
        </div>
      )}

      {/* Delivery location marker */}
      {deliveryPos && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
          style={{ left: `${deliveryPos.x}%`, top: `${deliveryPos.y}%` }}
        >
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xl transition-transform group-hover:scale-110">
            🏠
          </div>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded shadow text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-[150px] truncate">
            {deliveryAddress}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-30">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>🍔</span>
            <span className="text-foreground">Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🛵</span>
            <span className="text-foreground">Delivery Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className="text-foreground">Your Location</span>
          </div>
        </div>
      </div>

      {/* ETA Badge */}
      {eta && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-md z-30">
          <div className="text-xs font-medium">ETA</div>
          <div className="text-sm font-bold">{eta.duration}</div>
          <div className="text-xs opacity-80">{eta.distance}</div>
        </div>
      )}

      {/* Status indicator */}
      {orderStatus && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md z-30">
          <div className={`flex items-center gap-2 text-xs font-medium ${getStatusColor()}`}>
            <span className={`w-2 h-2 rounded-full ${
              orderStatus === "on_the_way" || orderStatus === "arriving" || orderStatus === "picked_up" 
                ? "bg-current animate-pulse" 
                : "bg-current"
            }`} />
            {getStatusText()}
          </div>
        </div>
      )}

      {/* Coordinates display (debug) */}
      {animatedPartner && (
        <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-mono text-muted-foreground z-30">
          {animatedPartner.lat.toFixed(4)}, {animatedPartner.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default MockDeliveryMap;
