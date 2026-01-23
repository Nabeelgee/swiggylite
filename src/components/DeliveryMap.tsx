import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons with status-based styling
const createIcon = (color: string, emoji: string, pulse = false) => {
  const pulseClass = pulse ? "animate-pulse" : "";
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${pulseClass}" style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white; transition: all 0.3s ease;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const restaurantIcon = createIcon("#FC8019", "🍔");
const homeIcon = createIcon("#3B82F6", "🏠");

// Status-based delivery icons
const getDeliveryIcon = (status?: OrderStatus) => {
  switch (status) {
    case "picked_up":
      return createIcon("#22C55E", "🛵", true);
    case "on_the_way":
      return createIcon("#F97316", "🛵", true);
    case "delivered":
      return createIcon("#22C55E", "✓");
    default:
      return createIcon("#22C55E", "🛵");
  }
};

// Status-based themes
const getMapTheme = (status?: OrderStatus): { routeColor: string; routeWeight: number; routeDash: string } => {
  switch (status) {
    case "picked_up":
      return { routeColor: "#22C55E", routeWeight: 5, routeDash: "10, 5" };
    case "on_the_way":
      return { routeColor: "#F97316", routeWeight: 6, routeDash: "" };
    case "delivered":
      return { routeColor: "#22C55E", routeWeight: 4, routeDash: "" };
    default:
      return { routeColor: "#FC8019", routeWeight: 4, routeDash: "10, 10" };
  }
};

// Smooth interpolation helper
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const interpolatePosition = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } => ({
  lat: lerp(from.lat, to.lat, t),
  lng: lerp(from.lng, to.lng, t),
});

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

interface DeliveryMapProps {
  restaurantLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  deliveryPartnerLocation?: { lat: number; lng: number };
  restaurantName?: string;
  deliveryAddress?: string;
  partnerName?: string;
  orderStatus?: OrderStatus;
  eta?: { distance: string; duration: string } | null;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  deliveryPartnerLocation,
  restaurantName = "Restaurant",
  deliveryAddress = "Delivery Address",
  partnerName = "Delivery Partner",
  orderStatus,
  eta,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [animatedPosition, setAnimatedPosition] = useState(deliveryPartnerLocation);
  const previousPositionRef = useRef(deliveryPartnerLocation);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Smooth position animation with reduced-motion support
  useEffect(() => {
    if (!deliveryPartnerLocation) return;

    const prevPos = previousPositionRef.current;
    if (!prevPos) {
      setAnimatedPosition(deliveryPartnerLocation);
      previousPositionRef.current = deliveryPartnerLocation;
      return;
    }

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion()) {
      setAnimatedPosition(deliveryPartnerLocation);
      previousPositionRef.current = deliveryPartnerLocation;
      return;
    }

    // Animate over 1 second
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);

      const newPos = interpolatePosition(prevPos, deliveryPartnerLocation, eased);
      setAnimatedPosition(newPos);

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        previousPositionRef.current = deliveryPartnerLocation;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [deliveryPartnerLocation]);

  // Default to Bangalore coordinates
  const defaultCenter: [number, number] = [12.9352, 77.6245];

  // Calculate center based on available locations
  const center: [number, number] = useMemo(() => {
    if (animatedPosition) {
      return [animatedPosition.lat, animatedPosition.lng];
    }
    if (restaurantLocation) {
      return [restaurantLocation.lat, restaurantLocation.lng];
    }
    if (deliveryLocation) {
      return [deliveryLocation.lat, deliveryLocation.lng];
    }
    return defaultCenter;
  }, [restaurantLocation, deliveryLocation, animatedPosition]);

  // Create route path
  const routePath: [number, number][] = useMemo(() => {
    const path: [number, number][] = [];
    if (restaurantLocation) {
      path.push([restaurantLocation.lat, restaurantLocation.lng]);
    }
    if (animatedPosition) {
      path.push([animatedPosition.lat, animatedPosition.lng]);
    }
    if (deliveryLocation) {
      path.push([deliveryLocation.lat, deliveryLocation.lng]);
    }
    return path;
  }, [restaurantLocation, deliveryLocation, animatedPosition]);

  // Update map view when center changes (using ref instead of useMap)
  useEffect(() => {
    if (mapRef.current && animatedPosition) {
      const shouldAnimate = !prefersReducedMotion();
      if (shouldAnimate) {
        mapRef.current.panTo([animatedPosition.lat, animatedPosition.lng], {
          animate: true,
          duration: 0.5,
        });
      } else {
        mapRef.current.setView([animatedPosition.lat, animatedPosition.lng], mapRef.current.getZoom());
      }
    }
  }, [animatedPosition]);

  // Get theme based on status
  const theme = getMapTheme(orderStatus);
  const deliveryIcon = getDeliveryIcon(orderStatus);

  // Callback to set map ref when container is ready
  const setMapRef = useCallback((map: L.Map | null) => {
    if (map) {
      mapRef.current = map;
    }
  }, []);

  // Don't render until mounted to avoid SSR/hydration issues
  if (!isMounted) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-lg bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ background: "#f5f5f5" }}
        ref={setMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line with status-based styling */}
        {routePath.length >= 2 && (
          <Polyline
            positions={routePath}
            color={theme.routeColor}
            weight={theme.routeWeight}
            opacity={0.8}
            dashArray={theme.routeDash}
          />
        )}

        {/* Restaurant marker */}
        {restaurantLocation && (
          <Marker
            position={[restaurantLocation.lat, restaurantLocation.lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{restaurantName}</strong>
                <p className="text-sm text-gray-500">Pickup location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Animated delivery partner marker */}
        {animatedPosition && (
          <Marker
            position={[animatedPosition.lat, animatedPosition.lng]}
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{partnerName}</strong>
                <p className="text-sm text-gray-500">
                  {orderStatus === "picked_up" && "Picked up your order"}
                  {orderStatus === "on_the_way" && "On the way to you"}
                  {!orderStatus && "Delivery partner"}
                </p>
                {eta && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {eta.distance} • {eta.duration}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery location marker */}
        {deliveryLocation && (
          <Marker
            position={[deliveryLocation.lat, deliveryLocation.lng]}
            icon={homeIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Delivery Location</strong>
                <p className="text-sm text-gray-500">{deliveryAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend with ETA */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-[1000]">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>🍔</span>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🛵</span>
            <span>Delivery Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span>Your Location</span>
          </div>
        </div>
      </div>

      {/* ETA Badge */}
      {eta && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-md z-[1000]">
          <div className="text-xs font-medium">ETA</div>
          <div className="text-sm font-bold">{eta.duration}</div>
          <div className="text-xs opacity-80">{eta.distance}</div>
        </div>
      )}

      {/* Status indicator */}
      {orderStatus && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md z-[1000]">
          <div className={`flex items-center gap-2 text-xs font-medium ${
            orderStatus === "on_the_way" || orderStatus === "arriving" ? "text-primary" :
            orderStatus === "picked_up" ? "text-swiggy-green" :
            "text-muted-foreground"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              orderStatus === "on_the_way" || orderStatus === "arriving" ? "bg-primary animate-pulse" :
              orderStatus === "picked_up" ? "bg-swiggy-green animate-pulse" :
              "bg-muted-foreground"
            }`} />
            {orderStatus === "picked_up" && "Order Picked Up"}
            {orderStatus === "on_the_way" && "On the Way"}
            {orderStatus === "arriving" && "Almost There!"}
            {orderStatus === "delivered" && "Delivered"}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
