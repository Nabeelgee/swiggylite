import { useState, useEffect, useRef } from "react";

interface Location {
  lat: number;
  lng: number;
}

interface ETAResult {
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Hook to calculate ETA using OSRM routing service
 * Updates when partner location changes, with debouncing to avoid excessive API calls
 */
export const useRouteETA = (
  partnerLocation: Location | null | undefined,
  deliveryLocation: Location | null | undefined
) => {
  const [eta, setEta] = useState<ETAResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!partnerLocation || !deliveryLocation) {
      setEta(null);
      return;
    }

    // Debounce: don't fetch more than once every 5 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchETA = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // OSRM expects coordinates in lng,lat format
        const url = `https://router.project-osrm.org/route/v1/driving/${partnerLocation.lng},${partnerLocation.lat};${deliveryLocation.lng},${deliveryLocation.lat}?overview=false`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch route");
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0]) {
          throw new Error("No route found");
        }

        const route = data.routes[0];
        const distanceMeters = route.distance;
        const durationSeconds = route.duration;

        // Format distance
        let distance: string;
        if (distanceMeters < 1000) {
          distance = `${Math.round(distanceMeters)} m`;
        } else {
          distance = `${(distanceMeters / 1000).toFixed(1)} km`;
        }

        // Format duration
        let duration: string;
        if (durationSeconds < 60) {
          duration = "< 1 min";
        } else if (durationSeconds < 3600) {
          duration = `${Math.round(durationSeconds / 60)} min`;
        } else {
          const hours = Math.floor(durationSeconds / 3600);
          const mins = Math.round((durationSeconds % 3600) / 60);
          duration = `${hours}h ${mins}m`;
        }

        setEta({
          distance,
          duration,
          distanceMeters,
          durationSeconds,
        });

        lastFetchRef.current = Date.now();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        console.error("ETA fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to batch rapid updates
    const timeoutId = setTimeout(fetchETA, 500);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [partnerLocation?.lat, partnerLocation?.lng, deliveryLocation?.lat, deliveryLocation?.lng]);

  return { eta, isLoading, error };
};
