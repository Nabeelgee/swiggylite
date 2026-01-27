import { useState, useCallback } from "react";

interface Location {
  lat: number;
  lng: number;
  id: string;
  name: string;
}

interface OptimizedRoute {
  orderedStops: Location[];
  totalDistance: number;
  totalDuration: number;
  segments: {
    from: Location;
    to: Location;
    distance: number;
    duration: number;
  }[];
}

// Calculate distance between two points using Haversine formula
const haversineDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Nearest Neighbor Algorithm for TSP
const nearestNeighborTSP = (
  start: Location,
  stops: Location[]
): Location[] => {
  if (stops.length <= 1) return stops;

  const result: Location[] = [];
  const remaining = [...stops];
  let current = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = haversineDistance(current, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const distance = haversineDistance(current, remaining[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = remaining.splice(nearestIndex, 1)[0];
    result.push(nearest);
    current = nearest;
  }

  return result;
};

// 2-opt improvement for TSP
const twoOptImprove = (route: Location[]): Location[] => {
  if (route.length < 4) return route;

  let improved = true;
  let bestRoute = [...route];

  while (improved) {
    improved = false;

    for (let i = 0; i < bestRoute.length - 2; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        const currentDistance =
          haversineDistance(bestRoute[i], bestRoute[i + 1]) +
          haversineDistance(bestRoute[j], bestRoute[(j + 1) % bestRoute.length]);

        const newDistance =
          haversineDistance(bestRoute[i], bestRoute[j]) +
          haversineDistance(bestRoute[i + 1], bestRoute[(j + 1) % bestRoute.length]);

        if (newDistance < currentDistance) {
          // Reverse the segment between i+1 and j
          const newRoute = [...bestRoute];
          const segment = newRoute.slice(i + 1, j + 1).reverse();
          newRoute.splice(i + 1, j - i, ...segment);
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
};

export const useRouteOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = useCallback(
    async (
      startLocation: Location,
      deliveryStops: Location[]
    ): Promise<OptimizedRoute | null> => {
      if (deliveryStops.length === 0) {
        setError("No delivery stops provided");
        return null;
      }

      setIsOptimizing(true);
      setError(null);

      try {
        // Step 1: Use nearest neighbor to get initial route
        let orderedStops = nearestNeighborTSP(startLocation, deliveryStops);

        // Step 2: Improve with 2-opt
        orderedStops = twoOptImprove(orderedStops);

        // Step 3: Fetch actual road distances from OSRM for the optimized order
        const allPoints = [startLocation, ...orderedStops];
        const coordinates = allPoints
          .map((loc) => `${loc.lng},${loc.lat}`)
          .join(";");

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&steps=false`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch route from OSRM");
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0]) {
          throw new Error("No route found");
        }

        const route = data.routes[0];

        // Build segments
        const segments = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
          segments.push({
            from: allPoints[i],
            to: allPoints[i + 1],
            distance: haversineDistance(allPoints[i], allPoints[i + 1]),
            duration: (route.duration / (allPoints.length - 1)) * (i + 1), // Approximate
          });
        }

        const result: OptimizedRoute = {
          orderedStops,
          totalDistance: route.distance,
          totalDuration: route.duration,
          segments,
        };

        setOptimizedRoute(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Optimization failed";
        setError(message);
        console.error("Route optimization error:", err);
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    []
  );

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return "< 1 min";
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)} min`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return {
    optimizeRoute,
    optimizedRoute,
    isOptimizing,
    error,
    formatDistance,
    formatDuration,
  };
};
