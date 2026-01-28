import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Star, Clock, MapPin, Package, ChefHat, Bike, CheckCircle2, XCircle, Wifi, WifiOff, Navigation, HelpCircle, RefreshCw } from "lucide-react";
import { useOrder, useOrderItems } from "@/hooks/useOrders";
import { useLiveOrderTracking } from "@/hooks/useLiveOrderTracking";
import { useRouteETA } from "@/hooks/useRouteETA";
import { useETANotifications } from "@/hooks/useETANotifications";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import MockMapWithTiles from "@/components/MockMapWithTiles";
import TrackingDebugPanel from "@/components/TrackingDebugPanel";
import OrderChat from "@/components/OrderChat";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Order not found</h1>
          <p className="text-muted-foreground text-sm md:text-base">The order you're looking for doesn't exist.</p>
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link to="/orders" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div className="text-center">
              <h1 className="font-semibold text-foreground">Track Order</h1>
              <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            {!isDelivered && !isCancelled && (
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                isConnected ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
              )}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isConnected ? "Live" : "..."}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Map Section */}
        {!isDelivered && !isCancelled ? (
          <div className="relative h-[35vh] min-h-[200px]">
            <MockMapWithTiles
              restaurantLocation={{ lat: 12.9352, lng: 77.6245 }}
              deliveryLocation={deliveryLocation || undefined}
              deliveryPartnerLocation={effectivePartnerLocation || undefined}
              restaurantName={order.restaurant_name}
              deliveryAddress={order.delivery_address}
              partnerName={partner?.name}
              orderStatus={order.status}
              eta={eta}
              zoom={14}
            />
            
            {/* ETA Badge */}
            {eta && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-card/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{eta.duration}</p>
                        <p className="text-xs text-muted-foreground">{eta.distance} away</p>
                      </div>
                    </div>
                    {partner && (
                      <a href={`tel:${partner.phone}`}>
                        <Button size="sm" className="rounded-full h-10 w-10 p-0">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "py-8 flex flex-col items-center justify-center",
            isDelivered ? "bg-gradient-to-r from-primary to-accent" : "bg-gradient-to-r from-destructive to-destructive/80"
          )}>
            {isDelivered ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-white mb-2" />
                <p className="text-lg font-bold text-white">Delivered Successfully!</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-white mb-2" />
                <p className="text-lg font-bold text-white">Order Cancelled</p>
              </>
            )}
          </div>
        )}

        {/* Mobile Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Delivery Partner - Mobile */}
          {partner && !isDelivered && !isCancelled && (
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-2xl">
                    🛵
                  </div>
                  {isConnected && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{partner.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{partner.rating}</span>
                    <span>•</span>
                    <span className="truncate">{partner.vehicle_number}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${partner.phone}`}>
                    <Button size="icon" variant="outline" className="rounded-full w-9 h-9">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </a>
                  <OrderChat 
                    orderId={orderId || ""} 
                    senderType="customer" 
                    partnerName={partner.name}
                    className="w-9 h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps - Mobile (Horizontal) */}
          {!isCancelled && (
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Order Status</span>
                <span className="text-xs text-primary font-semibold">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5 mb-4" />
              
              {/* Compact Timeline */}
              <div className="flex justify-between">
                {statusSteps.slice(0, 4).map((step, index) => {
                  const isCompleted = index <= Math.min(currentStatusIndex, 3);
                  const isCurrent = index === Math.min(currentStatusIndex, 3);
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isCompleted 
                          ? "bg-primary text-white" 
                          : "bg-muted text-muted-foreground",
                        isCurrent && "ring-2 ring-primary/30 ring-offset-2"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "text-[10px] mt-1.5 text-center line-clamp-1",
                        isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {step.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Items - Mobile */}
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{order.restaurant_name}</h3>
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "h:mm a")}
              </span>
            </div>
            
            <div className="space-y-2">
              {orderItems?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 border rounded-sm flex items-center justify-center",
                      item.is_veg ? "border-green-500" : "border-red-500"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.is_veg ? "bg-green-500" : "bg-red-500"
                      )} />
                    </div>
                    <span className="text-sm text-foreground">
                      {item.quantity}× {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    ₹{Number(item.price) * item.quantity}
                  </span>
                </div>
              ))}
              {orderItems && orderItems.length > 3 && (
                <p className="text-xs text-muted-foreground">+{orderItems.length - 3} more items</p>
              )}
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span className="text-primary">
                ₹{Number(order.total_amount) + Number(order.delivery_fee || 0) + Number(order.platform_fee || 0)}
              </span>
            </div>
          </div>

          {/* Delivery Address - Mobile */}
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">Delivery Address</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{order.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Help Button - Mobile */}
          <Button variant="outline" className="w-full rounded-xl h-12 gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>Need help?</span>
          </Button>
        </div>

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
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/orders" className="p-2 hover:bg-muted rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Order Tracking</h1>
                <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            {!isDelivered && !isCancelled && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                isConnected ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
              )}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isConnected ? "Live Tracking Active" : "Connecting..."}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Two-Column Layout */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Map & Tracking (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Map Section */}
            {!isDelivered && !isCancelled ? (
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border/50 h-[450px]">
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
                    <div className="bg-card/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                            <Clock className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-foreground">{eta.duration}</p>
                            <p className="text-sm text-muted-foreground">{eta.distance} away • Arriving soon</p>
                          </div>
                        </div>
                        {partner && (
                          <div className="flex gap-3">
                            <a href={`tel:${partner.phone}`}>
                              <Button size="lg" className="rounded-xl gap-2 h-12 px-5">
                                <Phone className="w-5 h-5" />
                                Call Driver
                              </Button>
                            </a>
                          </div>
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
              <div className={cn(
                "rounded-3xl p-12 flex flex-col items-center justify-center",
                isDelivered 
                  ? "bg-gradient-to-br from-primary via-primary to-accent" 
                  : "bg-gradient-to-br from-destructive to-destructive/80"
              )}>
                {isDelivered ? (
                  <>
                    <CheckCircle2 className="w-20 h-20 text-white mb-4" />
                    <p className="text-3xl font-bold text-white">Order Delivered!</p>
                    <p className="text-white/80 mt-2">Thank you for ordering with us</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-20 h-20 text-white mb-4" />
                    <p className="text-3xl font-bold text-white">Order Cancelled</p>
                    <p className="text-white/80 mt-2">Your refund will be processed shortly</p>
                  </>
                )}
              </div>
            )}

            {/* Progress Timeline - Desktop */}
            {!isCancelled && (
              <div className="bg-card rounded-3xl p-6 shadow-lg border border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">Order Progress</h2>
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercentage} className="w-32 h-2" />
                    <span className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}%</span>
                  </div>
                </div>

                {/* Horizontal Timeline */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.status} className="flex flex-col items-center flex-1">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500",
                            isCompleted 
                              ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30" 
                              : "bg-muted text-muted-foreground",
                            isCurrent && "ring-4 ring-primary/20 scale-110"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="mt-3 text-center">
                            <p className={cn(
                              "text-sm font-semibold transition-colors",
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {step.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 hidden xl:block">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {tracking?.status_message && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-sm text-primary font-medium">{tracking.status_message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Order Details (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Partner */}
            {partner && !isDelivered && !isCancelled && (
              <div className="bg-card rounded-3xl p-5 shadow-lg border border-border/50">
                <h3 className="font-semibold text-foreground mb-4">Delivery Partner</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl">
                      🛵
                    </div>
                    {isConnected && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-foreground">{partner.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{partner.rating}</span>
                      <span>•</span>
                      <span>{partner.vehicle_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{partner.vehicle_number}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <a href={`tel:${partner.phone}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl gap-2">
                      <Phone className="w-4 h-4" />
                      Call
                    </Button>
                  </a>
                  <div className="flex-1">
                    <OrderChat 
                      orderId={orderId || ""} 
                      senderType="customer" 
                      partnerName={partner.name}
                      className="w-full rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-card rounded-3xl p-5 shadow-lg border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Order Summary</h3>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "MMM d, h:mm a")}
                </span>
              </div>

              {/* Restaurant */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🍔</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{order.restaurant_name}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 border-2 rounded-sm flex items-center justify-center",
                        item.is_veg ? "border-green-500" : "border-red-500"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
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

              {/* Bill */}
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

            {/* Delivery Address */}
            <div className="bg-card rounded-3xl p-5 shadow-lg border border-border/50">
              <h3 className="font-semibold text-foreground mb-3">Delivery Address</h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{order.delivery_address}</p>
              </div>
            </div>

            {/* Help */}
            <Button variant="outline" className="w-full rounded-2xl h-14 gap-2 shadow-sm">
              <HelpCircle className="w-5 h-5" />
              Need help with your order?
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
