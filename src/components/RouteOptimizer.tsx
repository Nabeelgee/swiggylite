import React, { useState } from "react";
import { Route, Navigation, ArrowRight, Clock, MapPin, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";

interface DeliveryStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

interface RouteOptimizerProps {
  currentLocation: { lat: number; lng: number };
  deliveryStops: DeliveryStop[];
  onRouteOptimized?: (orderedStops: DeliveryStop[]) => void;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  currentLocation,
  deliveryStops,
  onRouteOptimized,
}) => {
  const { optimizeRoute, optimizedRoute, isOptimizing, error, formatDistance, formatDuration } = useRouteOptimization();
  const [hasOptimized, setHasOptimized] = useState(false);

  const handleOptimize = async () => {
    const startLocation = {
      id: "current",
      name: "Your Location",
      lat: currentLocation.lat,
      lng: currentLocation.lng,
    };

    const result = await optimizeRoute(startLocation, deliveryStops);
    
    if (result && onRouteOptimized) {
      onRouteOptimized(result.orderedStops);
    }
    setHasOptimized(true);
  };

  if (deliveryStops.length < 2) {
    return null; // No need to optimize for single delivery
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="w-5 h-5 text-primary" />
          Route Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasOptimized ? (
          <>
            <p className="text-sm text-muted-foreground">
              You have {deliveryStops.length} deliveries. Optimize your route to save time and fuel.
            </p>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Optimize Route
                </>
              )}
            </Button>
          </>
        ) : optimizedRoute ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">{formatDistance(optimizedRoute.totalDistance)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">{formatDuration(optimizedRoute.totalDuration)}</span>
              </div>
            </div>

            {/* Optimized Order */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Optimized Delivery Order
              </p>
              <div className="space-y-1">
                {optimizedRoute.orderedStops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {stop.name}
                      </p>
                    </div>
                    {index < optimizedRoute.orderedStops.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Re-optimize Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isOptimizing ? "animate-spin" : ""}`} />
              Re-optimize
            </Button>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleOptimize}>
              Try Again
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default RouteOptimizer;
