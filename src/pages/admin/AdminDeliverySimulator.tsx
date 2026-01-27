import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, MapPin, Navigation, Zap, Clock, Package, Truck, CheckCircle, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAllOrders } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

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
  status: OrderStatus;
  orders: {
    id: string;
    restaurant_name: string;
    delivery_address: string;
  };
}

// Status progression for auto-status feature
const STATUS_PROGRESSION: OrderStatus[] = [
  "confirmed",
  "preparing", 
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "arriving",
  "delivered"
];

// Mini map component showing delivery route
const MiniRouteMap: React.FC<{
  route: { lat: number; lng: number }[];
  currentPosition: { lat: number; lng: number } | null;
  currentIndex: number;
}> = ({ route, currentPosition, currentIndex }) => {
  // Calculate bounds
  const lats = route.map(p => p.lat);
  const lngs = route.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const padding = 20;
  const width = 280;
  const height = 200;
  
  const scaleX = (width - padding * 2) / (maxLng - minLng || 0.01);
  const scaleY = (height - padding * 2) / (maxLat - minLat || 0.01);
  const scale = Math.min(scaleX, scaleY);
  
  const toSvgX = (lng: number) => padding + (lng - minLng) * scale;
  const toSvgY = (lat: number) => height - padding - (lat - minLat) * scale;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <svg width={width} height={height} className="w-full">
        {/* Route path */}
        <polyline
          points={route.map(p => `${toSvgX(p.lng)},${toSvgY(p.lat)}`).join(" ")}
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Completed path */}
        <polyline
          points={route.slice(0, currentIndex + 1).map(p => `${toSvgX(p.lng)},${toSvgY(p.lat)}`).join(" ")}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Waypoints */}
        {route.map((point, i) => (
          <circle
            key={i}
            cx={toSvgX(point.lng)}
            cy={toSvgY(point.lat)}
            r={i === 0 || i === route.length - 1 ? 6 : 3}
            fill={i <= currentIndex ? "hsl(var(--primary))" : "hsl(var(--muted))"}
            stroke={i === 0 ? "#22c55e" : i === route.length - 1 ? "#ef4444" : "transparent"}
            strokeWidth="2"
          />
        ))}
        
        {/* Current position */}
        {currentPosition && (
          <g>
            <circle
              cx={toSvgX(currentPosition.lng)}
              cy={toSvgY(currentPosition.lat)}
              r="12"
              fill="hsl(var(--primary) / 0.3)"
              className="animate-ping"
            />
            <circle
              cx={toSvgX(currentPosition.lng)}
              cy={toSvgY(currentPosition.lat)}
              r="8"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={toSvgX(currentPosition.lng)}
              y={toSvgY(currentPosition.lat) + 4}
              textAnchor="middle"
              fontSize="10"
              fill="white"
            >
              🛵
            </text>
          </g>
        )}
        
        {/* Start/End labels */}
        <text x={toSvgX(route[0].lng)} y={toSvgY(route[0].lat) - 12} textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="bold">
          START
        </text>
        <text x={toSvgX(route[route.length-1].lng)} y={toSvgY(route[route.length-1].lat) - 12} textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="bold">
          END
        </text>
      </svg>
    </div>
  );
};

const AdminDeliverySimulator: React.FC = () => {
  const [trackingRecords, setTrackingRecords] = useState<OrderTracking[]>([]);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<keyof typeof ROUTE_PRESETS>("koramangala_to_hsr");
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [autoProgressStatus, setAutoProgressStatus] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: orders } = useAllOrders();

  // Fetch active order_tracking records
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

  // Update order_tracking location and optionally status
  const updateTrackingLocation = useCallback(async (lat: number, lng: number, progressPercent: number) => {
    if (!selectedTrackingId) return;

    const selectedTracking = trackingRecords.find(t => t.id === selectedTrackingId);
    if (!selectedTracking) return;

    // Determine status based on progress
    let newStatus: OrderStatus | undefined;
    if (autoProgressStatus) {
      if (progressPercent < 0.1) {
        newStatus = "picked_up";
      } else if (progressPercent < 0.5) {
        newStatus = "on_the_way";
      } else if (progressPercent < 0.9) {
        newStatus = "arriving";
      } else {
        newStatus = "delivered";
      }
    }

    const updateData: Record<string, unknown> = {
      current_latitude: lat,
      current_longitude: lng,
      updated_at: new Date().toISOString(),
    };

    if (newStatus && newStatus !== selectedTracking.status) {
      updateData.status = newStatus;
      updateData.status_message = getStatusMessage(newStatus);
      
      // Also update order status
      await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTracking.order_id);
    }

    const { error } = await supabase
      .from("order_tracking")
      .update(updateData)
      .eq("id", selectedTrackingId);

    if (error) {
      console.error("Error updating tracking location:", error);
      return;
    }

    setUpdateCount(prev => prev + 1);
  }, [selectedTrackingId, trackingRecords, autoProgressStatus]);

  const getStatusMessage = (status: OrderStatus): string => {
    const messages: Record<OrderStatus, string> = {
      placed: "Order received",
      confirmed: "Restaurant confirmed your order",
      preparing: "Chef is preparing your food",
      ready_for_pickup: "Order ready for pickup",
      picked_up: "Delivery partner picked up your order",
      on_the_way: "On the way to your location",
      arriving: "Almost there! Arriving soon",
      delivered: "Order delivered! Enjoy your meal",
      cancelled: "Order cancelled",
    };
    return messages[status];
  };

  // Interpolate between waypoints
  const interpolatePosition = (from: { lat: number; lng: number }, to: { lat: number; lng: number }, t: number) => ({
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  });

  // Simulation loop
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
      
      // Calculate overall progress
      const totalSteps = waypoints.length * subSteps;
      const completedSteps = currentWaypointIndex * subSteps + subStep;
      const progressPercent = completedSteps / totalSteps;
      
      setCurrentPosition(position);
      await updateTrackingLocation(position.lat, position.lng, progressPercent);

      subStep++;
      if (subStep >= subSteps) {
        subStep = 0;
        setCurrentWaypointIndex(nextWaypointIndex);
        
        if (nextWaypointIndex === 0) {
          toast.success("Route completed! Delivery finished.");
          setIsRunning(false);
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
    setUpdateCount(0);
    toast.success("Live simulation started! Updates going to order_tracking in real-time.");
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
    setUpdateCount(0);
    toast.info("Simulation reset");
  };

  const selectedTracking = trackingRecords.find(t => t.id === selectedTrackingId);
  const currentRoute = ROUTE_PRESETS[selectedRoute];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary animate-pulse" />
          Live Delivery Simulator
        </h2>
        <p className="text-muted-foreground">
          Real-time GPS simulation that updates customer's tracking map instantly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Simulation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Auto Progress Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Auto-Progress Order Status
                </label>
                <p className="text-xs text-muted-foreground">
                  Automatically updates status: picked_up → on_the_way → arriving → delivered
                </p>
              </div>
              <Switch
                checked={autoProgressStatus}
                onCheckedChange={setAutoProgressStatus}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1 gap-2" disabled={!selectedTrackingId}>
                  <Play className="w-4 h-4" />
                  Start Live Tracking
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

        {/* Live Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Live Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Running Status */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                isRunning 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>
                {isRunning ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Broadcasting
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    Paused
                  </>
                )}
              </span>
            </div>

            {/* Update Counter */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Updates Sent</span>
              <span className="text-lg font-bold text-primary">{updateCount}</span>
            </div>

            {/* Route Progress */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <span className="text-sm font-medium">Route Progress</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/60 h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(currentWaypointIndex / (currentRoute.waypoints.length - 1)) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-medium min-w-[40px] text-right">
                  {currentWaypointIndex + 1}/{currentRoute.waypoints.length}
                </span>
              </div>
            </div>

            {/* Current Position */}
            {currentPosition && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                <span className="text-xs font-medium text-primary">Broadcasting Position</span>
                <div className="font-mono text-xs">
                  <p>📍 {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}</p>
                </div>
              </div>
            )}

            {/* Selected Order Info */}
            {selectedTracking && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1 border-l-4 border-primary">
                <span className="text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  Selected Order
                </span>
                <p className="text-sm font-medium">{selectedTracking.orders?.restaurant_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  → {selectedTracking.orders?.delivery_address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mini Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Route Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <MiniRouteMap 
            route={currentRoute.waypoints} 
            currentPosition={currentPosition}
            currentIndex={currentWaypointIndex}
          />
          
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">How Live Tracking Works</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select an order with an assigned delivery partner</li>
                <li>Choose a route and click <strong>Start Live Tracking</strong></li>
                <li>GPS coordinates broadcast to <code className="bg-muted px-1 rounded">order_tracking</code> table</li>
                <li>Customer sees real-time movement on their tracking map</li>
              </ol>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
              <p className="text-green-700 dark:text-green-400 font-medium">
                ✓ Real-time updates via Supabase Realtime
              </p>
              <p className="text-green-600 dark:text-green-500 text-xs mt-1">
                Open <code>/order/[orderId]</code> in another tab to see live movement!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeliverySimulator;
