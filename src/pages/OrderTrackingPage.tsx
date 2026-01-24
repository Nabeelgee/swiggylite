import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Star, Clock, MapPin, Package, Truck, Home, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useOrder, useOrderItems } from "@/hooks/useOrders";
import { useLiveOrderTracking } from "@/hooks/useLiveOrderTracking";
import { useRouteETA } from "@/hooks/useRouteETA";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import DeliveryMap from "@/components/DeliveryMap";
import TrackingDebugPanel from "@/components/TrackingDebugPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "placed", label: "Order Placed", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: Package },
  { status: "preparing", label: "Preparing", icon: Package },
  { status: "picked_up", label: "Picked Up", icon: Truck },
  { status: "on_the_way", label: "On the Way", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
];

const getStatusIndex = (status: OrderStatus): number => {
  const index = statusSteps.findIndex((s) => s.status === status);
  return index >= 0 ? index : 0;
};

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: order, isLoading: orderLoading } = useOrder(orderId || "");
  const { data: orderItems } = useOrderItems(orderId || "");
  
  // Live tracking with real-time updates
  const { tracking, partner, partnerLocation, isConnected, lastUpdate } = useLiveOrderTracking(orderId || "");

  // Simulated delivery partner movement when no real location
  const [simulatedPartnerLocation, setSimulatedPartnerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Delivery location
  const deliveryLocation = order ? {
    lat: order.delivery_latitude || 12.9380,
    lng: order.delivery_longitude || 77.6290,
  } : null;

  // Use real partner location or simulated
  const effectivePartnerLocation = partnerLocation || simulatedPartnerLocation;

  // ETA calculation using OSRM routing
  const { eta, isLoading: etaLoading } = useRouteETA(effectivePartnerLocation, deliveryLocation);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Simulate delivery partner movement when no real tracking
  useEffect(() => {
    if (order && !partnerLocation && (order.status === "picked_up" || order.status === "on_the_way")) {
      const restaurantLat = 12.9352;
      const restaurantLng = 77.6245;
      const deliveryLat = order.delivery_latitude || 12.9380;
      const deliveryLng = order.delivery_longitude || 77.6290;

      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05; // Slower for smoother animation
        if (progress >= 1) {
          clearInterval(interval);
          return;
        }

        const currentLat = restaurantLat + (deliveryLat - restaurantLat) * progress;
        const currentLng = restaurantLng + (deliveryLng - restaurantLng) * progress;
        setSimulatedPartnerLocation({ lat: currentLat, lng: currentLng });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [order, partnerLocation]);

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Order not found</h1>
          <Link to="/orders">
            <Button>View all orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button & Connection Status */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to orders</span>
          </Link>

          {/* Live connection indicator */}
          {!isDelivered && !isCancelled && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
              isConnected 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Connecting...</span>
                </>
              )}
              {lastUpdate && (
                <span className="opacity-70">
                  • {format(lastUpdate, "h:mm:ss a")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Map & Status */}
          <div className="space-y-6">
            {/* Map */}
            {!isDelivered && !isCancelled && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Live Tracking</h2>
                  {eta && (
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <Clock className="w-4 h-4" />
                      <span>ETA: {eta.duration}</span>
                      <span className="text-muted-foreground">({eta.distance})</span>
                    </div>
                  )}
                </div>
                <DeliveryMap
                  restaurantLocation={{ lat: 12.9352, lng: 77.6245 }}
                  deliveryLocation={deliveryLocation || undefined}
                  deliveryPartnerLocation={effectivePartnerLocation || undefined}
                  restaurantName={order.restaurant_name}
                  deliveryAddress={order.delivery_address}
                  partnerName={partner?.name}
                  orderStatus={order.status}
                  eta={eta}
                />

                {/* Admin Debug Panel */}
                <TrackingDebugPanel
                  tracking={tracking}
                  partner={partner}
                  partnerLocation={effectivePartnerLocation}
                  isConnected={isConnected}
                  lastUpdate={lastUpdate}
                  eta={eta}
                />
              </div>
            )}

            {/* Order Status Timeline */}
            <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-6">Order Status</h2>

              {isCancelled ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">❌</span>
                  </div>
                  <p className="text-destructive font-semibold">Order Cancelled</p>
                </div>
              ) : (
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
                        {/* Line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? "bg-swiggy-green text-white"
                                : "bg-secondary text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-swiggy-green/30 animate-pulse" : ""}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`w-0.5 flex-1 mt-2 transition-colors duration-300 ${
                                index < currentStatusIndex
                                  ? "bg-swiggy-green"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1.5">
                          <p
                            className={`font-medium transition-colors ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && tracking?.status_message && (
                            <p className="text-sm text-muted-foreground mt-1 animate-fade-in">
                              {tracking.status_message}
                            </p>
                          )}
                          {isCurrent && eta && (step.status === "picked_up" || step.status === "on_the_way") && (
                            <p className="text-sm text-primary font-medium mt-1 animate-fade-in">
                              Arriving in ~{eta.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Details */}
          <div className="space-y-6">
            {/* Delivery Partner */}
            {partner && !isDelivered && !isCancelled && (
              <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Delivery Partner
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-swiggy-orange-light rounded-full flex items-center justify-center text-2xl relative">
                    🛵
                    {isConnected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{partner.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-swiggy-orange fill-swiggy-orange" />
                      <span>{partner.rating}</span>
                      <span>•</span>
                      <span>{partner.vehicle_type}</span>
                      <span>•</span>
                      <span>{partner.vehicle_number}</span>
                    </div>
                    {effectivePartnerLocation && eta && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <RefreshCw className={`w-3 h-3 ${etaLoading ? "animate-spin" : ""}`} />
                        <span>{eta.distance} away • {eta.duration}</span>
                      </div>
                    )}
                  </div>
                  <a href={`tel:${partner.phone}`}>
                    <Button size="icon" variant="outline" className="rounded-full">
                      <Phone className="w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
                <span className="text-sm text-muted-foreground">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-swiggy-orange-light rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-sm">🍔</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.restaurant_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>

                {order.estimated_delivery_time && !isDelivered && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Estimated Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.estimated_delivery_time), "h:mm a")}
                        {eta && (
                          <span className="text-primary font-medium ml-2">
                            (Dynamic: ~{eta.duration})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Items</h3>
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 border flex items-center justify-center ${
                          item.is_veg ? "border-swiggy-green" : "border-destructive"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_veg ? "bg-swiggy-green" : "bg-destructive"
                          }`}
                        />
                      </div>
                      <span className="text-foreground">
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      ₹{Number(item.price) * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Bill Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="text-foreground">₹{Number(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="text-foreground">
                    {Number(order.delivery_fee) === 0 ? "FREE" : `₹${Number(order.delivery_fee)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-foreground">₹{Number(order.platform_fee)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Grand Total</span>
                  <span className="text-foreground">
                    ₹{Number(order.total_amount) + Number(order.delivery_fee || 0) + Number(order.platform_fee || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Button */}
            <Button variant="outline" className="w-full">
              Need help with your order?
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTrackingPage;
