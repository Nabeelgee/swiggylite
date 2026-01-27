import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseGPSTrackingOptions {
  partnerId: string | undefined;
  isActive: boolean;
  updateInterval?: number; // ms between DB updates
  highAccuracy?: boolean;
}

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Hook for continuous GPS tracking that updates the order_tracking table in real-time
 * Uses watchPosition for smooth, continuous updates
 */
export function useGPSTracking({
  partnerId,
  isActive,
  updateInterval = 3000,
  highAccuracy = true,
}: UseGPSTrackingOptions) {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDbUpdate, setLastDbUpdate] = useState<Date | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const positionBufferRef = useRef<GPSPosition[]>([]);

  // Smooth position by averaging recent positions
  const smoothPosition = useCallback((newPos: GPSPosition): GPSPosition => {
    const buffer = positionBufferRef.current;
    buffer.push(newPos);
    
    // Keep last 3 positions for smoothing
    if (buffer.length > 3) {
      buffer.shift();
    }
    
    if (buffer.length === 1) return newPos;
    
    const avgLat = buffer.reduce((sum, p) => sum + p.lat, 0) / buffer.length;
    const avgLng = buffer.reduce((sum, p) => sum + p.lng, 0) / buffer.length;
    
    return {
      ...newPos,
      lat: avgLat,
      lng: avgLng,
    };
  }, []);

  // Update database with current position
  const updateDatabase = useCallback(async (position: GPSPosition) => {
    if (!partnerId) return;
    
    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) {
      return; // Throttle updates
    }
    
    lastUpdateRef.current = now;
    
    // Update all active order_tracking records for this partner
    const { error: trackingError } = await supabase
      .from("order_tracking")
      .update({
        current_latitude: position.lat,
        current_longitude: position.lng,
        updated_at: new Date().toISOString(),
      })
      .eq("delivery_partner_id", partnerId)
      .neq("status", "delivered")
      .neq("status", "cancelled");

    if (trackingError) {
      console.error("Failed to update tracking location:", trackingError);
      return;
    }

    // Also update delivery partner's location
    await supabase
      .from("delivery_partners")
      .update({
        current_latitude: position.lat,
        current_longitude: position.lng,
      })
      .eq("id", partnerId);

    setLastDbUpdate(new Date());
  }, [partnerId, updateInterval]);

  // Start/stop tracking based on isActive
  useEffect(() => {
    if (!isActive || !partnerId) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setIsTracking(true);
    setError(null);

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: GPSPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        const smoothedPos = smoothPosition(newPos);
        setCurrentPosition(smoothedPos);
        updateDatabase(smoothedPos);
      },
      (err) => {
        console.error("GPS Error:", err);
        setError(err.message);
        
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable location access.");
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, partnerId, highAccuracy, smoothPosition, updateDatabase]);

  // Manual position update
  const forceUpdate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    return new Promise<GPSPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newPos: GPSPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          
          setCurrentPosition(newPos);
          
          // Force database update
          lastUpdateRef.current = 0;
          await updateDatabase(newPos);
          
          resolve(newPos);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [updateDatabase]);

  return {
    currentPosition,
    isTracking,
    error,
    lastDbUpdate,
    forceUpdate,
  };
}
