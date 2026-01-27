import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SimpleLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  trigger?: React.ReactNode;
}

// Mercator projection helpers
const latToY = (lat: number) => Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360)));
const yToLat = (y: number) => (Math.atan(Math.exp(y)) - Math.PI / 4) * 360 / Math.PI;

const SimpleLocationPicker: React.FC<SimpleLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    initialLocation || { lat: 12.9716, lng: 77.5946 }
  );
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 500, height: 350 });
  const zoom = 15;

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
  }, [open]);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (lat: number, lng: number) => {
    const scale = Math.pow(2, zoom) * 256;
    const worldX = ((lng + 180) / 360) * scale;
    const worldY = ((1 - latToY(lat) / Math.PI) / 2) * scale;
    
    const centerWorldX = ((position.lng + 180) / 360) * scale;
    const centerWorldY = ((1 - latToY(position.lat) / Math.PI) / 2) * scale;
    
    return {
      x: containerSize.width / 2 + (worldX - centerWorldX),
      y: containerSize.height / 2 + (worldY - centerWorldY),
    };
  };

  // Generate OSM tile URLs
  const tiles = useMemo(() => {
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    
    const centerTileX = Math.floor(((position.lng + 180) / 360) * scale);
    const centerTileY = Math.floor(((1 - latToY(position.lat) / Math.PI) / 2) * scale);
    
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
  }, [position, zoom, containerSize]);

  const handleMapClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const scale = Math.pow(2, zoom) * 256;
    const centerWorldX = ((position.lng + 180) / 360) * scale;
    const centerWorldY = ((1 - latToY(position.lat) / Math.PI) / 2) * scale;
    
    const worldX = centerWorldX + (clickX - containerSize.width / 2);
    const worldY = centerWorldY + (clickY - containerSize.height / 2);
    
    const lng = (worldX / scale) * 360 - 180;
    const lat = yToLat(Math.PI * (1 - 2 * worldY / scale));
    
    setPosition({ lat, lng });
    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: position.lat,
      lng: position.lng,
      address: address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
    });
    setOpen(false);
  };

  const markerPixel = latLngToPixel(position.lat, position.lng);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MapPin className="w-4 h-4" />
            Select Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-4">
          <div className="flex gap-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address or click on map"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              disabled={isLocating}
              title="Use current location"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? "animate-pulse" : ""}`} />
            </Button>
          </div>

          <div
            ref={containerRef}
            className="h-[350px] rounded-lg overflow-hidden border relative cursor-crosshair"
            onClick={handleMapClick}
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

            {/* Center marker */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none"
              style={{ left: markerPixel.x, top: markerPixel.y }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
              </div>
            </div>

            {/* Crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-primary/30" />
            </div>

            {/* OSM Attribution */}
            <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground/60 z-30">
              © OpenStreetMap
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Click on the map to select your delivery location
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary/90">
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleLocationPicker;
