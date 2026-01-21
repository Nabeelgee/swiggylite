import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const restaurantIcon = createIcon("#FC8019", "🍔");
const deliveryIcon = createIcon("#22C55E", "🛵");
const homeIcon = createIcon("#3B82F6", "🏠");

interface MapUpdaterProps {
  center: [number, number];
  zoom: number;
}

// Separate component for map updates that uses the map context
function MapUpdater({ center, zoom }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

interface DeliveryMapProps {
  restaurantLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  deliveryPartnerLocation?: { lat: number; lng: number };
  restaurantName?: string;
  deliveryAddress?: string;
  partnerName?: string;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  deliveryPartnerLocation,
  restaurantName = "Restaurant",
  deliveryAddress = "Delivery Address",
  partnerName = "Delivery Partner",
}) => {
  // Track if component is mounted to avoid issues with conditional rendering
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Default to Bangalore coordinates
  const defaultCenter: [number, number] = [12.9352, 77.6245];
  
  // Calculate center based on available locations
  const center: [number, number] = React.useMemo(() => {
    if (deliveryPartnerLocation) {
      return [deliveryPartnerLocation.lat, deliveryPartnerLocation.lng];
    }
    if (restaurantLocation) {
      return [restaurantLocation.lat, restaurantLocation.lng];
    }
    if (deliveryLocation) {
      return [deliveryLocation.lat, deliveryLocation.lng];
    }
    return defaultCenter;
  }, [restaurantLocation, deliveryLocation, deliveryPartnerLocation]);

  // Create route path
  const routePath: [number, number][] = React.useMemo(() => {
    const path: [number, number][] = [];
    if (restaurantLocation) {
      path.push([restaurantLocation.lat, restaurantLocation.lng]);
    }
    if (deliveryPartnerLocation) {
      path.push([deliveryPartnerLocation.lat, deliveryPartnerLocation.lng]);
    }
    if (deliveryLocation) {
      path.push([deliveryLocation.lat, deliveryLocation.lng]);
    }
    return path;
  }, [restaurantLocation, deliveryLocation, deliveryPartnerLocation]);

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
      >
        <MapUpdater center={center} zoom={14} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line */}
        {routePath.length >= 2 && (
          <Polyline
            positions={routePath}
            color="#FC8019"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
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

        {/* Delivery partner marker */}
        {deliveryPartnerLocation && (
          <Marker
            position={[deliveryPartnerLocation.lat, deliveryPartnerLocation.lng]}
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{partnerName}</strong>
                <p className="text-sm text-gray-500">On the way</p>
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

      {/* Legend */}
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
    </div>
  );
};

export default DeliveryMap;
