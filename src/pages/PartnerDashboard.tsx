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
  User
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
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

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // For demo purposes, we'll use the first delivery partner
  // In production, this would be linked to the authenticated user
  const { data: currentPartner, isLoading: partnerLoading } = useQuery({
    queryKey: ["current_delivery_partner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
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
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Update order status mutation
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
      // Update order_tracking
      const { error: trackingError } = await supabase
        .from("order_tracking")
        .update({
          status: newStatus,
          status_message: `Status updated to ${getStatusLabel(newStatus)}`,
          updated_at: new Date().toISOString(),
        })
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
      toast.success("Order status updated!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Update partner location
  const updateLocation = async () => {
    if (!currentPartner?.id) return;
    
    setIsUpdatingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const { error } = await supabase
            .from("delivery_partners")
            .update({
              current_latitude: latitude,
              current_longitude: longitude,
            })
            .eq("id", currentPartner.id);

          if (error) {
            toast.error("Failed to update location");
          } else {
            toast.success("Location updated!");
            queryClient.invalidateQueries({ queryKey: ["current_delivery_partner"] });
          }
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
              <p className="text-3xl font-bold text-swiggy-green">
                {currentPartner?.rating?.toFixed(1) || "4.5"}
              </p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>

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
                  <Card key={tracking.id} className="overflow-hidden">
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
                        <div className="flex items-center justify-center gap-2 py-3 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Delivered Successfully!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
