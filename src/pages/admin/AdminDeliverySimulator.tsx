import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, MapPin, Navigation, Zap, Clock, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAllOrders } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// Predefined route presets (Bangalore coordinates)
const ROUTE_PRESETS = {
  koramangala_to_hsr: {
    name: "Koramangala → HSR Layout",
    waypoints: [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9340, lng: 77.6260 },
      { lat: 12.9320, lng: 77.6280 },
      { lat: 12.9300, lng: 77.6300 },
      { lat: 12.9280, lng: 77.6320 },
      { lat: 12.9260, lng: 77.6340 },
      { lat: 12.9240, lng: 77.6360 },
      { lat: 12.9220, lng: 77.6380 },
      { lat: 12.9200, lng: 77.6400 },
      { lat: 12.9180, lng: 77.6420 },
    ],
  },
  whitefield_to_indiranagar: {
    name: "Whitefield → Indiranagar",
    waypoints: [
      { lat: 12.9698, lng: 77.7500 },
      { lat: 12.9680, lng: 77.7400 },
      { lat: 12.9660, lng: 77.7300 },
      { lat: 12.9640, lng: 77.7200 },
      { lat: 12.9620, lng: 77.7100 },
      { lat: 12.9700, lng: 77.6900 },
      { lat: 12.9750, lng: 77.6700 },
      { lat: 12.9780, lng: 77.6500 },
      { lat: 12.9810, lng: 77.6400 },
      { lat: 12.9784, lng: 77.6408 },
    ],
  },
  btm_to_jayanagar: {
    name: "BTM Layout → Jayanagar",
    waypoints: [
      { lat: 12.9166, lng: 77.6101 },
      { lat: 12.9180, lng: 77.6050 },
      { lat: 12.9200, lng: 77.6000 },
      { lat: 12.9220, lng: 77.5950 },
      { lat: 12.9250, lng: 77.5920 },
      { lat: 12.9280, lng: 77.5900 },
      { lat: 12.9300, lng: 77.5880 },
      { lat: 12.9320, lng: 77.5850 },
      { lat: 12.9340, lng: 77.5830 },
      { lat: 12.9250, lng: 77.5830 },
    ],
  },
  custom_circle: {
    name: "Circular Route (Demo)",
    waypoints: [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9380, lng: 77.6280 },
      { lat: 12.9400, lng: 77.6320 },
      { lat: 12.9380, lng: 77.6360 },
      { lat: 12.9352, lng: 77.6380 },
      { lat: 12.9320, lng: 77.6360 },
      { lat: 12.9300, lng: 77.6320 },
      { lat: 12.9320, lng: 77.6280 },
      { lat: 12.9352, lng: 77.6245 },
    ],
  },
};

interface OrderTracking {
  id: string;
  order_id: string;
  delivery_partner_id: string | null;
  status: string;
  orders: {
    id: string;
    restaurant_name: string;
    delivery_address: string;
  };
}

const AdminDeliverySimulator: React.FC = () => {
  const [trackingRecords, setTrackingRecords] = useState<OrderTracking[]>([]);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<keyof typeof ROUTE_PRESETS>("koramangala_to_hsr");
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: orders } = useAllOrders();

  // Fetch active order_tracking records (orders being delivered)
  useEffect(() => {
    const fetchTrackingRecords = async () => {
      const { data, error } = await supabase
        .from("order_tracking")
        .select(`
          id,
          order_id,
          delivery_partner_id,
          status,
          orders (
            id,
            restaurant_name,
            delivery_address
          )
        `)
        .in("status", ["confirmed", "preparing", "ready_for_pickup", "picked_up", "on_the_way", "arriving"])
        .order("updated_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching tracking records:", error);
        return;
      }
      
      setTrackingRecords((data || []) as unknown as OrderTracking[]);
      if (data && data.length > 0 && !selectedTrackingId) {
        setSelectedTrackingId(data[0].id);
      }
    };

    fetchTrackingRecords();

    // Subscribe to changes
    const channel = supabase
      .channel("tracking-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_tracking" }, () => {
        fetchTrackingRecords();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTrackingId]);

  // Update order_tracking location in database
  const updateTrackingLocation = useCallback(async (lat: number, lng: number) => {
    if (!selectedTrackingId) return;

    const { error } = await supabase
      .from("order_tracking")
      .update({
        current_latitude: lat,
        current_longitude: lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTrackingId);

    if (error) {
      console.error("Error updating tracking location:", error);
      toast.error("Failed to update location");
    }
  }, [selectedTrackingId]);

  // Interpolate between waypoints for smoother movement
  const interpolatePosition = (from: { lat: number; lng: number }, to: { lat: number; lng: number }, t: number) => ({
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  });

  // Simulation loop - now updates order_tracking directly
  useEffect(() => {
    if (!isRunning || !selectedTrackingId) return;

    const route = ROUTE_PRESETS[selectedRoute];
    const waypoints = route.waypoints;
    const baseInterval = 2000;
    const interval = baseInterval / speed;

    let subStep = 0;
    const subSteps = 5;

    intervalRef.current = setInterval(async () => {
      const currentWaypoint = waypoints[currentWaypointIndex];
      const nextWaypointIndex = (currentWaypointIndex + 1) % waypoints.length;
      const nextWaypoint = waypoints[nextWaypointIndex];

      const t = subStep / subSteps;
      const position = interpolatePosition(currentWaypoint, nextWaypoint, t);
      
      setCurrentPosition(position);
      await updateTrackingLocation(position.lat, position.lng);

      subStep++;
      if (subStep >= subSteps) {
        subStep = 0;
        setCurrentWaypointIndex(nextWaypointIndex);
        
        if (nextWaypointIndex === 0) {
          toast.success("Route loop completed!");
        }
      }
    }, interval / subSteps);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, selectedTrackingId, selectedRoute, currentWaypointIndex, speed, updateTrackingLocation]);

  const handleStart = () => {
    if (!selectedTrackingId) {
      toast.error("Please select an order to simulate");
      return;
    }
    setIsRunning(true);
    toast.success("Simulation started! Location updates going to order_tracking.");
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    toast.info("Simulation paused");
  };

  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentWaypointIndex(0);
    setCurrentPosition(null);
    toast.info("Simulation reset");
  };

  const selectedTracking = trackingRecords.find(t => t.id === selectedTrackingId);
  const currentRoute = ROUTE_PRESETS[selectedRoute];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Order Tracking Simulator</h2>
        <p className="text-muted-foreground">
          Simulate GPS movement for order tracking (writes to order_tracking table)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Simulation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Select Order to Track
              </label>
              <Select value={selectedTrackingId} onValueChange={setSelectedTrackingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active order" />
                </SelectTrigger>
                <SelectContent>
                  {trackingRecords.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No active orders with tracking
                    </SelectItem>
                  ) : (
                    trackingRecords.map((tracking) => (
                      <SelectItem key={tracking.id} value={tracking.id}>
                        {tracking.orders?.restaurant_name || "Unknown"} - {tracking.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {trackingRecords.length} active order(s) with tracking
              </p>
            </div>

            {/* Route Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Route Preset
              </label>
              <Select 
                value={selectedRoute} 
                onValueChange={(v) => setSelectedRoute(v as keyof typeof ROUTE_PRESETS)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROUTE_PRESETS).map(([key, route]) => (
                    <SelectItem key={key} value={key}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {currentRoute.waypoints.length} waypoints in route
              </p>
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Speed: {speed}x
              </label>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={0.5}
                max={5}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Slow)</span>
                <span>5x (Fast)</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1 gap-2" disabled={!selectedTrackingId}>
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} variant="secondary" className="flex-1 gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Running Status */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isRunning 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>
                {isRunning ? "🟢 Running" : "⏸️ Paused"}
              </span>
            </div>

            {/* Current Position */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <span className="text-sm font-medium">Current Position</span>
              {currentPosition ? (
                <div className="font-mono text-xs">
                  <p>Lat: {currentPosition.lat.toFixed(6)}</p>
                  <p>Lng: {currentPosition.lng.toFixed(6)}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Not started</p>
              )}
            </div>

            {/* Waypoint Progress */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <span className="text-sm font-medium">Route Progress</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(currentWaypointIndex / (currentRoute.waypoints.length - 1)) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {currentWaypointIndex + 1}/{currentRoute.waypoints.length}
                </span>
              </div>
            </div>

            {/* Selected Order Info */}
            {selectedTracking && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-2">
                <span className="text-sm font-medium text-primary">Selected Order</span>
                <div className="text-xs space-y-1">
                  <p><strong>Restaurant:</strong> {selectedTracking.orders?.restaurant_name}</p>
                  <p><strong>Status:</strong> {selectedTracking.status}</p>
                  <p><strong>Tracking ID:</strong> {selectedTracking.id.slice(0, 8)}...</p>
                  <p className="text-muted-foreground truncate">
                    <strong>To:</strong> {selectedTracking.orders?.delivery_address}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Test Live Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Create an order from the main app and complete checkout</li>
            <li>Assign a delivery partner to the order in the <strong>Orders</strong> page</li>
            <li>Select the order in this simulator dropdown</li>
            <li>Choose a route preset and click <strong>Start</strong></li>
            <li>Open the order tracking page (<code>/order/:orderId</code>) in another tab</li>
            <li>Watch the delivery marker move in real-time on the map!</li>
          </ol>
          <p className="pt-2 border-t border-border">
            <strong>Note:</strong> This simulator writes directly to <code>order_tracking.current_latitude/longitude</code>, 
            so the tracking map will update in real-time for the selected order.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeliverySimulator;
