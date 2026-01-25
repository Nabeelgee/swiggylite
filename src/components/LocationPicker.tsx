import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcon = L.divIcon({
  html: `<div style="background: hsl(28, 97%, 54%); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: "custom-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  trigger?: React.ReactNode;
}

/**
 * Helper child to safely capture the Leaflet map instance.
 * Avoid using `ref` on MapContainer which can crash (`render2 is not a function`) in some setups.
 */
const MapInstanceCapture: React.FC<{ onReady: (map: L.Map) => void }> = ({ onReady }) => {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [12.9716, 77.5946]
  );
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Handle map click via ref instead of useMapEvents hook
  useEffect(() => {
    if (!open) return;
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [isMounted, mapReady, open]);

  // Recenter map when position changes via ref instead of useMap hook
  useEffect(() => {
    if (mapReady && mapRef.current) {
      mapRef.current.setView(position, 15);
    }
  }, [position, mapReady]);

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
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
      lat: position[0],
      lng: position[1],
      address: address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
    });
    setOpen(false);
  };

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

          <div className="h-[350px] rounded-lg overflow-hidden border">
            {isMounted && (
              <MapContainer
                center={position}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapInstanceCapture onReady={handleMapReady} />
                <Marker position={position} icon={customIcon} />
              </MapContainer>
            )}
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

export default LocationPicker;
