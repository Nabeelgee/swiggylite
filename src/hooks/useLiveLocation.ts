import { useState, useEffect, useCallback } from "react";

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface UseLiveLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Hook for getting user's current GPS location
 * Defaults to Koramangala, Bangalore if geolocation fails
 */
export const useLiveLocation = (options: UseLiveLocationOptions = {}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Default location: Vellore district, Tamil Nadu
  const defaultLocation: Location = {
    lat: 12.9165,
    lng: 79.1325,
  };

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
  } = options;

  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsSupported(false);
        reject(new Error("Geolocation not supported"));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          setIsLoading(false);
          resolve(loc);
        },
        (err) => {
          setIsLoading(false);
          setError(err.message);
          
          // Use default location on error
          setLocation(defaultLocation);
          reject(err);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Try to get location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsSupported(false);
      setLocation(defaultLocation);
      return;
    }

    getCurrentLocation().catch(() => {
      // Error already handled in getCurrentLocation
    });
  }, [getCurrentLocation]);

  return {
    location,
    isLoading,
    error,
    isSupported,
    getCurrentLocation,
    defaultLocation,
  };
};
