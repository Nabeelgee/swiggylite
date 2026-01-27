import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  CheckCircle, 
  Truck,
  Home,
  RefreshCw,
  User,
  AlertCircle,
  Wifi,
  WifiOff,
  Locate,
  Route
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { useGPSTracking } from "@/hooks/useGPSTracking";
import { useNavigationInstructions } from "@/hooks/useNavigationInstructions";
import NavigationInstructions from "@/components/NavigationInstructions";
import RouteOptimizer from "@/components/RouteOptimizer";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface AssignedOrder {
  id: string;
  order_id: string;
  status: OrderStatus;
  status_message: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  updated_at: string;
  orders: {
    id: string;
    restaurant_name: string;
    delivery_address: string;
    total_amount: number;
    status: OrderStatus;
    delivery_latitude: number | null;
    delivery_longitude: number | null;
    created_at: string;
  };
}

const STATUS_FLOW: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "confirmed", label: "Accept Order", icon: CheckCircle },
  { status: "preparing", label: "At Restaurant", icon: Package },
  { status: "ready_for_pickup", label: "Ready for Pickup", icon: Package },
  { status: "picked_up", label: "Picked Up", icon: Truck },
  { status: "on_the_way", label: "On the Way", icon: Navigation },
  { status: "arriving", label: "Arriving", icon: MapPin },
  { status: "delivered", label: "Delivered", icon: Home },
];

const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
  const currentIndex = STATUS_FLOW.findIndex(s => s.status === currentStatus);
  if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
    return STATUS_FLOW[currentIndex + 1].status;
  }
  return null;
};

const getStatusLabel = (status: OrderStatus): string => {
  const found = STATUS_FLOW.find(s => s.status === status);
  return found?.label || status;
};

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "confirmed":
    case "preparing":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "ready_for_pickup":
    case "picked_up":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "on_the_way":
    case "arriving":
      return "bg-primary/10 text-primary";
    case "delivered":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Order Card Component with Navigation
interface OrderCardWithNavigationProps {
  tracking: AssignedOrder;
  order: AssignedOrder["orders"];
  nextStatus: OrderStatus | null;
  currentPartner: any;
  gpsPosition: { lat: number; lng: number } | null;
  updateStatus: any;
  getStatusColor: (status: OrderStatus) => string;
  getStatusLabel: (status: OrderStatus) => string;
}

const OrderCardWithNavigation: React.FC<OrderCardWithNavigationProps> = ({
  tracking,
  order,
  nextStatus,
  currentPartner,
  gpsPosition,
  updateStatus,
  getStatusColor,
  getStatusLabel,
}) => {
  const [showNavigation, setShowNavigation] = useState(false);
  
  // Get current location for navigation (prefer GPS, fall back to partner's stored location)
  const currentLocation = gpsPosition || 
    (currentPartner?.current_latitude && currentPartner?.current_longitude 
      ? { lat: currentPartner.current_latitude, lng: currentPartner.current_longitude }
      : null);
  
  const deliveryLocation = order.delivery_latitude && order.delivery_longitude
    ? { lat: order.delivery_latitude, lng: order.delivery_longitude }
    : null;

  // Fetch navigation instructions
  const { navigation, isLoading: navLoading } = useNavigationInstructions(
    currentLocation,
    deliveryLocation
  );

  // Show navigation for active delivery statuses
  const isActiveDelivery = ["picked_up", "on_the_way", "arriving"].includes(tracking.status);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {order.restaurant_name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge className={getStatusColor(tracking.status)}>
            {getStatusLabel(tracking.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation Instructions - Show for active deliveries */}
        {isActiveDelivery && navigation && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              className="w-full gap-2"
            >
              <Route className="w-4 h-4" />
              {showNavigation ? "Hide Navigation" : "Show Turn-by-Turn Navigation"}
              <span className="ml-auto text-xs text-muted-foreground">
                {navigation.totalDistance} • {navigation.totalDuration}
              </span>
            </Button>
            
            {showNavigation && (
              <NavigationInstructions
                steps={navigation.steps}
                totalDistance={navigation.totalDistance}
                totalDuration={navigation.totalDuration}
                isLoading={navLoading}
              />
            )}
          </div>
        )}

        {/* Delivery Address */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Delivery Address
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {order.delivery_address}
            </p>
          </div>
          {order.delivery_latitude && order.delivery_longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1">
                <Navigation className="w-4 h-4" />
                <span className="hidden sm:inline">Navigate</span>
              </Button>
            </a>
          )}
        </div>

        {/* Order Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(order.created_at), "h:mm a")}
            </span>
          </div>
          <p className="font-semibold text-foreground">
            ₹{order.total_amount}
          </p>
        </div>

        {/* Action Button */}
        {nextStatus && (
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => updateStatus.mutate({
              orderId: order.id,
              trackingId: tracking.id,
              newStatus: nextStatus,
            })}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              STATUS_FLOW.find(s => s.status === nextStatus)?.icon && 
              React.createElement(
                STATUS_FLOW.find(s => s.status === nextStatus)!.icon,
                { className: "w-4 h-4" }
              )
            )}
            {`Mark as ${getStatusLabel(nextStatus)}`}
          </Button>
        )}

        {tracking.status === "delivered" && (
          <div className="flex items-center justify-center gap-2 py-3 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Delivered Successfully!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);

  // Fetch the delivery partner linked to the current user's profile
  const { data: currentPartner, isLoading: partnerLoading, error: partnerError } = useQuery({
    queryKey: ["current_delivery_partner", profile?.delivery_partner_id],
    queryFn: async () => {
      if (!profile?.delivery_partner_id) {
        return null;
      }

      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .eq("id", profile.delivery_partner_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.delivery_partner_id,
  });

  // Fetch assigned orders for this partner
  const { data: assignedOrders, isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ["partner_assigned_orders", currentPartner?.id],
    queryFn: async () => {
      if (!currentPartner?.id) return [];

      const { data, error } = await supabase
        .from("order_tracking")
        .select(`
          *,
          orders (
            id,
            restaurant_name,
            delivery_address,
            total_amount,
            status,
            delivery_latitude,
            delivery_longitude,
            created_at
          )
        `)
        .eq("delivery_partner_id", currentPartner.id)
        .neq("status", "delivered")
        .neq("status", "cancelled")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as unknown as AssignedOrder[];
    },
    enabled: !!currentPartner?.id,
    refetchInterval: 10000,
  });

  // Live GPS tracking hook
  const { 
    currentPosition: gpsPosition, 
    isTracking: gpsActive, 
    error: gpsError,
    lastDbUpdate,
    forceUpdate: forceLocationUpdate 
  } = useGPSTracking({
    partnerId: currentPartner?.id,
    isActive: liveTrackingEnabled && !!currentPartner?.id,
    updateInterval: 3000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      trackingId, 
      newStatus 
    }: { 
      orderId: string; 
      trackingId: string; 
      newStatus: OrderStatus;
    }) => {
      // Update order_tracking with current GPS location if available
      const updateData: {
        status: OrderStatus;
        status_message: string;
        updated_at: string;
        current_latitude?: number;
        current_longitude?: number;
      } = {
        status: newStatus,
        status_message: `Status updated to ${getStatusLabel(newStatus)}`,
        updated_at: new Date().toISOString(),
      };

      // Try to get current location for tracking updates
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              enableHighAccuracy: true,
              timeout: 5000 
            });
          });
          updateData.current_latitude = position.coords.latitude;
          updateData.current_longitude = position.coords.longitude;
        } catch {
          // Use partner's last known location if GPS fails
          if (currentPartner?.current_latitude && currentPartner?.current_longitude) {
            updateData.current_latitude = currentPartner.current_latitude;
            updateData.current_longitude = currentPartner.current_longitude;
          }
        }
      }

      const { error: trackingError } = await supabase
        .from("order_tracking")
        .update(updateData)
        .eq("id", trackingId);

      if (trackingError) throw trackingError;

      // Update orders table status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_assigned_orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order_tracking"] });
      toast.success("Order status updated!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Update partner location - now updates order_tracking as well
  const updateLocation = async () => {
    if (!currentPartner?.id) return;
    
    setIsUpdatingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update delivery partner's location
          const { error: partnerError } = await supabase
            .from("delivery_partners")
            .update({
              current_latitude: latitude,
              current_longitude: longitude,
            })
            .eq("id", currentPartner.id);

          if (partnerError) {
            toast.error("Failed to update partner location");
            setIsUpdatingLocation(false);
            return;
          }

          // Also update all active order_tracking records for this partner
          const { error: trackingError } = await supabase
            .from("order_tracking")
            .update({
              current_latitude: latitude,
              current_longitude: longitude,
              updated_at: new Date().toISOString(),
            })
            .eq("delivery_partner_id", currentPartner.id)
            .neq("status", "delivered")
            .neq("status", "cancelled");

          if (trackingError) {
            console.error("Failed to update tracking location:", trackingError);
          }

          toast.success("Location updated!");
          queryClient.invalidateQueries({ queryKey: ["current_delivery_partner"] });
          queryClient.invalidateQueries({ queryKey: ["order_tracking"] });
          setIsUpdatingLocation(false);
        },
        (error) => {
          toast.error("Could not get location");
          setIsUpdatingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported");
      setIsUpdatingLocation(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentPartner?.id) return;

    const channel = supabase
      .channel("partner-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_tracking",
          filter: `delivery_partner_id=eq.${currentPartner.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPartner?.id, refetch]);

  if (authLoading || partnerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access the Partner Dashboard.
            </p>
            <Button onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is not linked to a delivery partner
  if (!profile?.delivery_partner_id || !currentPartner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Not a Delivery Partner</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not linked to a delivery partner profile. Please contact an administrator to set up your partner account.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeOrders = assignedOrders?.filter(o => o.orders) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Partner Dashboard</h1>
                <p className="text-xs text-primary-foreground/80">
                  {currentPartner?.name || "Delivery Partner"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={updateLocation}
              disabled={isUpdatingLocation}
              className="gap-2"
            >
              <Navigation className={`w-4 h-4 ${isUpdatingLocation ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Update Location</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Live Tracking Toggle */}
        <Card className={`border-2 transition-colors ${liveTrackingEnabled ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-border"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gpsActive ? (
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">Live GPS Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    {gpsActive 
                      ? `Sharing location every 3s${lastDbUpdate ? ` • Updated ${format(lastDbUpdate, "h:mm:ss a")}` : ""}`
                      : "Enable to share your location in real-time"
                    }
                  </p>
                  {gpsError && (
                    <p className="text-xs text-destructive mt-1">{gpsError}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gpsPosition && (
                  <div className="text-xs text-muted-foreground text-right hidden sm:block">
                    <p>{gpsPosition.lat.toFixed(5)}</p>
                    <p>{gpsPosition.lng.toFixed(5)}</p>
                  </div>
                )}
                <Switch
                  checked={liveTrackingEnabled}
                  onCheckedChange={setLiveTrackingEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{activeOrders.length}</p>
              <p className="text-sm text-muted-foreground">Active Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {currentPartner?.rating?.toFixed(1) || "4.5"}
              </p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Route Optimizer - Show when multiple active orders */}
        {activeOrders.length > 1 && gpsPosition && (
          <RouteOptimizer
            currentLocation={gpsPosition}
            deliveryStops={activeOrders.map(tracking => ({
              id: tracking.order_id,
              name: tracking.orders.restaurant_name,
              lat: tracking.orders.delivery_latitude || 12.938,
              lng: tracking.orders.delivery_longitude || 77.629,
              address: tracking.orders.delivery_address,
            }))}
            onRouteOptimized={(orderedStops) => {
              toast.success(`Route optimized! Deliver in order: ${orderedStops.map(s => s.name).join(' → ')}`);
            }}
          />
        )}

        {/* Active Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Deliveries</h2>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active deliveries</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New orders will appear here when assigned
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((tracking) => {
                const order = tracking.orders;
                const nextStatus = getNextStatus(tracking.status);

                return (
                  <OrderCardWithNavigation
                    key={tracking.id}
                    tracking={tracking}
                    order={order}
                    nextStatus={nextStatus}
                    currentPartner={currentPartner}
                    gpsPosition={gpsPosition}
                    updateStatus={updateStatus}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Partner Info */}
        {currentPartner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Partner Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="text-foreground">
                  {currentPartner.vehicle_type} - {currentPartner.vehicle_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <a href={`tel:${currentPartner.phone}`} className="text-primary">
                  {currentPartner.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Location</span>
                <span className="text-foreground font-mono text-xs">
                  {currentPartner.current_latitude?.toFixed(4) || "N/A"}, 
                  {currentPartner.current_longitude?.toFixed(4) || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PartnerDashboard;
