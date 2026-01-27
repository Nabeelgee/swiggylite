import { useState, useEffect, useRef } from "react";

interface Location {
  lat: number;
  lng: number;
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  type: string;
  modifier?: string;
  streetName?: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: {
    bearing_after: number;
    bearing_before: number;
    location: [number, number]; // [lng, lat]
    type: string;
    modifier?: string;
  };
}

interface NavigationResult {
  steps: NavigationStep[];
  totalDistance: string;
  totalDuration: string;
  geometry: [number, number][]; // Route coordinates
}

const getManeuverIcon = (type: string, modifier?: string): string => {
  switch (type) {
    case "turn":
      if (modifier === "left") return "↰";
      if (modifier === "right") return "↱";
      if (modifier === "slight left") return "↖";
      if (modifier === "slight right") return "↗";
      if (modifier === "sharp left") return "⮢";
      if (modifier === "sharp right") return "⮣";
      if (modifier === "uturn") return "↩";
      return "→";
    case "new name":
    case "continue":
      return "↑";
    case "merge":
      return "⤵";
    case "on ramp":
    case "off ramp":
      return "⤴";
    case "fork":
      if (modifier === "left") return "⑂";
      return "⑃";
    case "end of road":
      if (modifier === "left") return "↰";
      return "↱";
    case "roundabout":
    case "rotary":
      return "⟳";
    case "arrive":
      return "🏁";
    case "depart":
      return "🚀";
    default:
      return "→";
  }
};

const formatInstruction = (step: any): string => {
  const maneuver = step.maneuver;
  let instruction = "";
  
  const streetName = step.name || step.ref || "";
  const destination = step.destinations?.split(",")[0] || "";
  
  switch (maneuver.type) {
    case "depart":
      instruction = `Start on ${streetName || "the road"}`;
      if (step.name) instruction += ` heading ${getBearingDirection(maneuver.bearing_after)}`;
      break;
    case "arrive":
      instruction = "You have arrived at your destination";
      if (maneuver.modifier === "left") instruction += " (on the left)";
      if (maneuver.modifier === "right") instruction += " (on the right)";
      break;
    case "turn":
      instruction = `Turn ${maneuver.modifier || ""} onto ${streetName || "the road"}`.trim();
      break;
    case "continue":
    case "new name":
      instruction = `Continue onto ${streetName || "the road"}`;
      break;
    case "merge":
      instruction = `Merge ${maneuver.modifier || ""} onto ${streetName || destination || "the highway"}`.trim();
      break;
    case "on ramp":
      instruction = `Take the ramp ${destination ? `toward ${destination}` : ""}`.trim();
      break;
    case "off ramp":
      instruction = `Take the exit ${destination ? `toward ${destination}` : ""}`.trim();
      break;
    case "fork":
      instruction = `Keep ${maneuver.modifier || "straight"} at the fork${streetName ? ` onto ${streetName}` : ""}`;
      break;
    case "end of road":
      instruction = `At the end of the road, turn ${maneuver.modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();
      break;
    case "roundabout":
    case "rotary":
      const exit = step.maneuver?.exit || "";
      instruction = `Enter the roundabout${exit ? ` and take the ${getOrdinal(exit)} exit` : ""}${streetName ? ` onto ${streetName}` : ""}`;
      break;
    default:
      instruction = `Continue on ${streetName || "the road"}`;
  }
  
  return instruction;
};

const getBearingDirection = (bearing: number): string => {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDistance = (meters: number): string => {
  if (meters < 50) return "Now";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return "< 1 min";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

/**
 * Hook to fetch turn-by-turn navigation instructions from OSRM
 */
export const useNavigationInstructions = (
  startLocation: Location | null | undefined,
  endLocation: Location | null | undefined
) => {
  const [navigation, setNavigation] = useState<NavigationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!startLocation || !endLocation) {
      setNavigation(null);
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

    const fetchNavigation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // OSRM with steps=true for turn-by-turn navigation
        const url = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Failed to fetch navigation");
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0]) {
          throw new Error("No route found");
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        // Parse steps into navigation instructions
        const steps: NavigationStep[] = leg.steps.map((step: any) => ({
          instruction: formatInstruction(step),
          distance: formatDistance(step.distance),
          duration: formatDuration(step.duration),
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
          streetName: step.name || step.ref || undefined,
          distanceMeters: step.distance,
          durationSeconds: step.duration,
          maneuver: {
            bearing_after: step.maneuver.bearing_after,
            bearing_before: step.maneuver.bearing_before,
            location: step.maneuver.location,
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
          },
        }));

        // Filter out very short steps (less than 10 meters) except arrive/depart
        const filteredSteps = steps.filter(
          (step) => step.distanceMeters > 10 || step.type === "arrive" || step.type === "depart"
        );

        setNavigation({
          steps: filteredSteps,
          totalDistance: formatDistance(route.distance),
          totalDuration: formatDuration(route.duration),
          geometry: route.geometry.coordinates,
        });

        lastFetchRef.current = key;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Navigation fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to batch rapid updates
    const timeoutId = setTimeout(fetchNavigation, 300);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startLocation?.lat, startLocation?.lng, endLocation?.lat, endLocation?.lng]);

  return { navigation, isLoading, error };
};

export { getManeuverIcon };
