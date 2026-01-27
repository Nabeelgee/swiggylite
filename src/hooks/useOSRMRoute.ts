import { useState, useEffect, useRef } from "react";

interface Location {
  lat: number;
  lng: number;
}

interface RouteResult {
  geometry: [number, number][]; // [lng, lat] pairs
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Hook to fetch actual road route geometry from OSRM
 * Returns the route path coordinates for drawing on map
 */
export const useOSRMRoute = (
  startLocation: Location | null | undefined,
  endLocation: Location | null | undefined
) => {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!startLocation || !endLocation) {
      setRoute(null);
      return;
    }

    // Create a key to check if locations changed significantly
    const key = `${startLocation.lat.toFixed(4)},${startLocation.lng.toFixed(4)}-${endLocation.lat.toFixed(4)},${endLocation.lng.toFixed(4)}`;
    
    // Don't refetch if locations haven't changed much
    if (key === lastFetchRef.current) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // OSRM expects coordinates in lng,lat format
        // overview=full returns the full geometry
        // geometries=geojson returns coordinates as [lng, lat] array
        const url = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`;

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

        const routeData = data.routes[0];
        const distanceMeters = routeData.distance;
        const durationSeconds = routeData.duration;

        // Extract geometry coordinates
        const geometry = routeData.geometry.coordinates as [number, number][];

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

        setRoute({
          geometry,
          distance,
          duration,
          distanceMeters,
          durationSeconds,
        });

        lastFetchRef.current = key;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Route fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to batch rapid updates
    const timeoutId = setTimeout(fetchRoute, 300);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startLocation?.lat, startLocation?.lng, endLocation?.lat, endLocation?.lng]);

  return { route, isLoading, error };
};
