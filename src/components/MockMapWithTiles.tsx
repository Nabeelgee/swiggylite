import React, { useEffect, useState, useRef, useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface MockMapWithTilesProps {
  restaurantLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  deliveryPartnerLocation?: { lat: number; lng: number };
  restaurantName?: string;
  deliveryAddress?: string;
  partnerName?: string;
  orderStatus?: OrderStatus;
  eta?: { distance: string; duration: string } | null;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  zoom?: number;
}

// Mercator projection helpers
const latToY = (lat: number) => Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360)));
const yToLat = (y: number) => (Math.atan(Math.exp(y)) - Math.PI / 4) * 360 / Math.PI;

const MockMapWithTiles: React.FC<MockMapWithTilesProps> = ({
  restaurantLocation,
  deliveryLocation,
  deliveryPartnerLocation,
  restaurantName = "Restaurant",
  deliveryAddress = "Delivery Address",
  partnerName = "Delivery Partner",
  orderStatus,
  eta,
  interactive = false,
  onLocationSelect,
  zoom = 15,
}) => {
  const [animatedPartner, setAnimatedPartner] = useState(deliveryPartnerLocation);
  const previousPosRef = useRef(deliveryPartnerLocation);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });
  const velocityRef = useRef({ lat: 0, lng: 0 });

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth animation for partner movement with spring physics
  useEffect(() => {
    if (!deliveryPartnerLocation) return;

    const prevPos = previousPosRef.current;
    if (!prevPos) {
      setAnimatedPartner(deliveryPartnerLocation);
      previousPosRef.current = deliveryPartnerLocation;
      return;
    }

    // Calculate velocity for momentum
    const distLat = deliveryPartnerLocation.lat - prevPos.lat;
    const distLng = deliveryPartnerLocation.lng - prevPos.lng;
    
    const duration = 2000; // Longer duration for smoother movement
    const startTime = performance.now();
    const startPos = animatedPartner ? { ...animatedPartner } : prevPos;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Spring easing for natural movement
      const springT = 1 - Math.pow(1 - t, 4) * Math.cos(t * Math.PI * 0.5);
      
      setAnimatedPartner({
        lat: startPos.lat + (deliveryPartnerLocation.lat - startPos.lat) * springT,
        lng: startPos.lng + (deliveryPartnerLocation.lng - startPos.lng) * springT,
      });

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousPosRef.current = deliveryPartnerLocation;
        velocityRef.current = { lat: distLat / (duration / 1000), lng: distLng / (duration / 1000) };
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [deliveryPartnerLocation]);

  // Calculate center and bounds
  const allPoints = useMemo(() => {
    return [restaurantLocation, deliveryLocation, animatedPartner].filter(Boolean) as { lat: number; lng: number }[];
  }, [restaurantLocation, deliveryLocation, animatedPartner]);

  const center = useMemo(() => {
    if (allPoints.length === 0) return { lat: 12.935, lng: 77.625 };
    const avgLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;
    return { lat: avgLat, lng: avgLng };
  }, [allPoints]);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (lat: number, lng: number) => {
    const scale = Math.pow(2, zoom) * 256;
    const worldX = ((lng + 180) / 360) * scale;
    const worldY = ((1 - latToY(lat) / Math.PI) / 2) * scale;
    
    const centerWorldX = ((center.lng + 180) / 360) * scale;
    const centerWorldY = ((1 - latToY(center.lat) / Math.PI) / 2) * scale;
    
    return {
      x: containerSize.width / 2 + (worldX - centerWorldX),
      y: containerSize.height / 2 + (worldY - centerWorldY),
    };
  };

  // Generate OSM tile URLs
  const tiles = useMemo(() => {
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    
    const centerTileX = Math.floor(((center.lng + 180) / 360) * scale);
    const centerTileY = Math.floor(((1 - latToY(center.lat) / Math.PI) / 2) * scale);
    
    const tilesNeededX = Math.ceil(containerSize.width / tileSize / 2) + 1;
    const tilesNeededY = Math.ceil(containerSize.height / tileSize / 2) + 1;
    
    const tiles: { x: number; y: number; url: string; pixelX: number; pixelY: number }[] = [];
    
    for (let dx = -tilesNeededX; dx <= tilesNeededX; dx++) {
      for (let dy = -tilesNeededY; dy <= tilesNeededY; dy++) {
        const tileX = centerTileX + dx;
        const tileY = centerTileY + dy;
        
        if (tileX >= 0 && tileY >= 0 && tileX < scale && tileY < scale) {
          const tileLng = (tileX / scale) * 360 - 180;
          const tileLatY = Math.PI * (1 - 2 * tileY / scale);
          const tileLat = (Math.atan(Math.sinh(tileLatY)) * 180) / Math.PI;
          
          const pixel = latLngToPixel(tileLat, tileLng);
          
          tiles.push({
            x: tileX,
            y: tileY,
            url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
            pixelX: pixel.x,
            pixelY: pixel.y,
          });
        }
      }
    }
    
    return tiles;
  }, [center, zoom, containerSize]);

  const restaurantPixel = restaurantLocation ? latLngToPixel(restaurantLocation.lat, restaurantLocation.lng) : null;
  const deliveryPixel = deliveryLocation ? latLngToPixel(deliveryLocation.lat, deliveryLocation.lng) : null;
  const partnerPixel = animatedPartner ? latLngToPixel(animatedPartner.lat, animatedPartner.lng) : null;

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive || !onLocationSelect || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const scale = Math.pow(2, zoom) * 256;
    const centerWorldX = ((center.lng + 180) / 360) * scale;
    const centerWorldY = ((1 - latToY(center.lat) / Math.PI) / 2) * scale;
    
    const worldX = centerWorldX + (clickX - containerSize.width / 2);
    const worldY = centerWorldY + (clickY - containerSize.height / 2);
    
    const lng = (worldX / scale) * 360 - 180;
    const lat = yToLat(Math.PI * (1 - 2 * worldY / scale));
    
    onLocationSelect(lat, lng);
  };

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
    <div
      ref={containerRef}
      className={`relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-lg bg-muted ${
        interactive ? "cursor-crosshair" : ""
      }`}
      onClick={handleClick}
    >
      {/* OSM Tiles */}
      <div className="absolute inset-0">
        {tiles.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={tile.url}
            alt=""
            className="absolute w-[256px] h-[256px]"
            style={{
              left: tile.pixelX,
              top: tile.pixelY,
            }}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>

      {/* Route line */}
      {restaurantPixel && deliveryPixel && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {/* Background path */}
          <path
            d={`M ${restaurantPixel.x} ${restaurantPixel.y} ${
              partnerPixel
                ? `Q ${(restaurantPixel.x + deliveryPixel.x) / 2} ${
                    Math.min(restaurantPixel.y, deliveryPixel.y) - 30
                  } ${partnerPixel.x} ${partnerPixel.y} T`
                : "L"
            } ${deliveryPixel.x} ${deliveryPixel.y}`}
            stroke="hsl(28, 97%, 54%)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={orderStatus === "on_the_way" ? "none" : "8 8"}
            opacity="0.6"
          />
          {/* Progress line */}
          {partnerPixel && (
            <path
              d={`M ${restaurantPixel.x} ${restaurantPixel.y} L ${partnerPixel.x} ${partnerPixel.y}`}
              stroke="hsl(28, 97%, 54%)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {/* Restaurant marker */}
      {restaurantPixel && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
          style={{ left: restaurantPixel.x, top: restaurantPixel.y }}
        >
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-3 border-white text-2xl transition-transform group-hover:scale-110">
            🍔
          </div>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border">
            {restaurantName}
          </div>
        </div>
      )}

      {/* Delivery partner marker with motion trail */}
      {partnerPixel && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
          style={{ left: partnerPixel.x, top: partnerPixel.y }}
        >
          {/* Motion trail rings */}
          {(orderStatus === "on_the_way" || orderStatus === "picked_up") && (
            <>
              <div className="absolute w-16 h-16 bg-green-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 animate-ping" />
              <div className="absolute w-12 h-12 bg-green-400/30 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 animate-pulse" />
            </>
          )}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white text-2xl transition-transform group-hover:scale-110 ${
              orderStatus === "on_the_way" || orderStatus === "picked_up"
                ? "bg-green-500"
                : "bg-green-500"
            }`}
          >
            🛵
          </div>
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border">
            {partnerName}
          </div>
        </div>
      )}

      {/* Delivery location marker */}
      {deliveryPixel && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
          style={{ left: deliveryPixel.x, top: deliveryPixel.y }}
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-3 border-white text-2xl transition-transform group-hover:scale-110">
            🏠
          </div>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-[180px] truncate border">
            {deliveryAddress}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-30 border">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍔</span>
            <span className="text-foreground font-medium">Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛵</span>
            <span className="text-foreground font-medium">Delivery Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-foreground font-medium">Your Location</span>
          </div>
        </div>
      </div>

      {/* ETA Badge */}
      {eta && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-xl px-4 py-2 shadow-lg z-30">
          <div className="text-xs font-medium opacity-80">ETA</div>
          <div className="text-lg font-bold">{eta.duration}</div>
          <div className="text-xs opacity-80">{eta.distance}</div>
        </div>
      )}

      {/* Status indicator */}
      {orderStatus && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg z-30 border">
          <div className={`flex items-center gap-2 text-sm font-medium ${getStatusColor()}`}>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                orderStatus === "on_the_way" || orderStatus === "arriving" || orderStatus === "picked_up"
                  ? "bg-current animate-pulse"
                  : "bg-current"
              }`}
            />
            {getStatusText()}
          </div>
        </div>
      )}

      {/* OSM Attribution */}
      <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground/60 z-30">
        © OpenStreetMap
      </div>
    </div>
  );
};

export default MockMapWithTiles;
