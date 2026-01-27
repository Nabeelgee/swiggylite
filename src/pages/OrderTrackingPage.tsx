import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Star, Clock, MapPin, Package, ChefHat, Bike, CheckCircle2, XCircle, Wifi, WifiOff, Navigation, MessageCircle, HelpCircle } from "lucide-react";
import { useOrder, useOrderItems } from "@/hooks/useOrders";
import { useLiveOrderTracking } from "@/hooks/useLiveOrderTracking";
import { useRouteETA } from "@/hooks/useRouteETA";
import { useETANotifications } from "@/hooks/useETANotifications";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import MockMapWithTiles from "@/components/MockMapWithTiles";
import TrackingDebugPanel from "@/components/TrackingDebugPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface StatusStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ElementType;
}

const statusSteps: StatusStep[] = [
  { status: "placed", label: "Order Placed", description: "We've received your order", icon: Package },
  { status: "confirmed", label: "Confirmed", description: "Restaurant is preparing", icon: ChefHat },
  { status: "preparing", label: "Preparing", description: "Your food is being cooked", icon: ChefHat },
  { status: "picked_up", label: "Picked Up", description: "Driver has your order", icon: Bike },
  { status: "on_the_way", label: "On the Way", description: "Headed to your location", icon: Navigation },
  { status: "delivered", label: "Delivered", description: "Enjoy your meal!", icon: CheckCircle2 },
];

const getStatusIndex = (status: OrderStatus): number => {
  const index = statusSteps.findIndex((s) => s.status === status);
  return index >= 0 ? index : 0;
};

const getProgressPercentage = (status: OrderStatus): number => {
  const index = getStatusIndex(status);
  return ((index + 1) / statusSteps.length) * 100;
};

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: order, isLoading: orderLoading } = useOrder(orderId || "");
  const { data: orderItems } = useOrderItems(orderId || "");
  
  const { tracking, partner, partnerLocation, isConnected, lastUpdate } = useLiveOrderTracking(orderId || "");
  const { data: isAdmin } = useIsAdmin();

  const [simulatedPartnerLocation, setSimulatedPartnerLocation] = useState<{ lat: number; lng: number } | null>(null);

  const deliveryLocation = order ? {
    lat: order.delivery_latitude || 12.9380,
    lng: order.delivery_longitude || 77.6290,
  } : null;

  const effectivePartnerLocation = partnerLocation || simulatedPartnerLocation;
  const { eta, isLoading: etaLoading } = useRouteETA(effectivePartnerLocation, deliveryLocation);

  const isDeliveryInProgress = !!(order && (order.status === "picked_up" || order.status === "on_the_way" || order.status === "arriving"));
  useETANotifications({
    orderId: orderId || "",
    partnerLocation: effectivePartnerLocation,
    deliveryLocation,
    partnerName: partner?.name,
    isEnabled: isDeliveryInProgress,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (order && !partnerLocation && (order.status === "picked_up" || order.status === "on_the_way")) {
      const restaurantLat = 12.9352;
      const restaurantLng = 77.6245;
      const deliveryLat = order.delivery_latitude || 12.9380;
      const deliveryLng = order.delivery_longitude || 77.6290;

      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Order not found</h1>
          <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
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
  const progressPercentage = getProgressPercentage(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Hero Section with Map */}
      <div className="relative">
        {/* Back Button & Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm rounded-full text-foreground hover:bg-card transition-colors shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            {!isDelivered && !isCancelled && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg",
                isConnected 
                  ? "bg-green-500/90 text-white" 
                  : "bg-yellow-500/90 text-white"
              )}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isConnected ? "Live Tracking" : "Connecting..."}</span>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        {!isDelivered && !isCancelled ? (
          <div className="h-[40vh] min-h-[280px] relative">
            <MockMapWithTiles
              restaurantLocation={{ lat: 12.9352, lng: 77.6245 }}
              deliveryLocation={deliveryLocation || undefined}
              deliveryPartnerLocation={effectivePartnerLocation || undefined}
              restaurantName={order.restaurant_name}
              deliveryAddress={order.delivery_address}
              partnerName={partner?.name}
              orderStatus={order.status}
              eta={eta}
              zoom={15}
            />
            
            {/* ETA Overlay */}
            {eta && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{eta.duration}</p>
                        <p className="text-sm text-muted-foreground">{eta.distance} away</p>
                      </div>
                    </div>
                    {partner && (
                      <a href={`tel:${partner.phone}`}>
                        <Button size="icon" className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90">
                          <Phone className="w-5 h-5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <TrackingDebugPanel
                tracking={tracking}
                partner={partner}
                partnerLocation={effectivePartnerLocation}
                isConnected={isConnected}
                lastUpdate={lastUpdate}
                eta={eta}
              />
            )}
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary via-primary to-accent flex items-center justify-center">
            <div className="text-center text-white pt-12">
              {isDelivered ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xl font-bold">Order Delivered!</p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xl font-bold">Order Cancelled</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 -mt-4 relative z-10 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Progress Card */}
          {!isCancelled && (
            <div className="bg-card rounded-3xl p-6 shadow-xl border border-border/50 animate-fade-in">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Order Progress</span>
                  <span className="text-sm text-primary font-semibold">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Status Timeline */}
              <div className="space-y-0">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="relative">
                      <div className={cn(
                        "flex items-start gap-4 p-3 rounded-2xl transition-all duration-300",
                        isCurrent && "bg-primary/5 border border-primary/20"
                      )}>
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
                          isCompleted 
                            ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30" 
                            : "bg-muted text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20 scale-110"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <p className={cn(
                            "font-semibold transition-colors",
                            isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {isCurrent && tracking?.status_message && (
                            <p className="text-sm text-primary font-medium mt-1 animate-fade-in">
                              {tracking.status_message}
                            </p>
                          )}
                        </div>

                        {/* Status Indicator */}
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>

                      {/* Connector Line */}
                      {index < statusSteps.length - 1 && (
                        <div className="absolute left-[27px] top-[52px] w-0.5 h-4 bg-border">
                          <div 
                            className={cn(
                              "w-full transition-all duration-500",
                              index < currentStatusIndex ? "bg-primary h-full" : "h-0"
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Partner Card */}
          {partner && !isDelivered && !isCancelled && (
            <div className="bg-card rounded-3xl p-5 shadow-xl border border-border/50 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl">
                    🛵
                  </div>
                  {isConnected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-foreground">{partner.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{partner.rating}</span>
                    <span>•</span>
                    <span>{partner.vehicle_type}</span>
                    <span>•</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{partner.vehicle_number}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${partner.phone}`}>
                    <Button size="icon" variant="outline" className="rounded-full w-11 h-11">
                      <Phone className="w-5 h-5" />
                    </Button>
                  </a>
                  <Button size="icon" variant="outline" className="rounded-full w-11 h-11">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Card */}
          <div className="bg-card rounded-3xl p-5 shadow-xl border border-border/50 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-foreground">Order Details</h2>
              <span className="text-xs font-mono bg-muted px-3 py-1 rounded-full text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            {/* Restaurant & Address */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🍔</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{order.restaurant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">Delivery Address</p>
                  <p className="text-xs text-muted-foreground truncate">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Order Items */}
            <div className="space-y-2 mb-4">
              <h3 className="font-medium text-foreground text-sm">Items Ordered</h3>
              {orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 border-2 rounded-sm",
                      item.is_veg ? "border-green-500" : "border-red-500"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full m-0.5",
                        item.is_veg ? "bg-green-500" : "bg-red-500"
                      )} />
                    </div>
                    <span className="text-sm text-foreground">
                      {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    ₹{Number(item.price) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Bill Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Item Total</span>
                <span>₹{Number(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span className={Number(order.delivery_fee) === 0 ? "text-green-500 font-medium" : ""}>
                  {Number(order.delivery_fee) === 0 ? "FREE" : `₹${Number(order.delivery_fee)}`}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee</span>
                <span>₹{Number(order.platform_fee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg text-foreground">
                <span>Grand Total</span>
                <span className="text-primary">
                  ₹{Number(order.total_amount) + Number(order.delivery_fee || 0) + Number(order.platform_fee || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Help Button */}
          <Button variant="outline" className="w-full rounded-2xl h-14 gap-2 shadow-lg">
            <HelpCircle className="w-5 h-5" />
            Need help with your order?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
