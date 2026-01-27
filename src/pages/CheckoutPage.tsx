import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCreateOrder } from "@/hooks/useOrders";
import Header from "@/components/Header";
import SimpleLocationPicker from "@/components/SimpleLocationPicker";
import MockMapWithTiles from "@/components/MockMapWithTiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, getTotalPrice, clearCart, currentRestaurantId } = useCart();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState(profile?.default_address || "");
  const [deliveryCoords, setDeliveryCoords] = useState({ lat: 12.938, lng: 77.629 });
  const [instructions, setInstructions] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 500 ? 0 : 40;
  const platformFee = 5;
  const grandTotal = totalPrice + deliveryFee + platformFee;

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (items.length === 0) {
      navigate("/");
    }
  }, [items, navigate]);

  React.useEffect(() => {
    if (profile?.default_address && !address) {
      setAddress(profile.default_address);
    }
  }, [profile, address]);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    if (!currentRestaurantId || items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Prevent double-clicks
    if (isPlacing) return;

    setIsPlacing(true);

    try {
      const order = await createOrder.mutateAsync({
        restaurantId: currentRestaurantId,
        restaurantName: items[0].restaurantName,
        items: items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: item.isVeg,
        })),
        totalAmount: totalPrice,
        deliveryFee,
        deliveryAddress: address,
        deliveryLatitude: deliveryCoords.lat,
        deliveryLongitude: deliveryCoords.lng,
        specialInstructions: instructions || undefined,
      });

      // Clear cart first, then navigate to confirmation page
      clearCart();
      
      // Navigate to confirmation page
      setTimeout(() => {
        navigate(`/order/${order.id}/confirmation`, { replace: true });
      }, 100);
    } catch (error) {
      // Error is already handled in the hook
      setIsPlacing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-swiggy-orange-light rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Delivery Address
                </h2>
              </div>

              <div className="space-y-4">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address"
                  className="flex-1"
                />
                
                {/* Map Preview */}
                <div className="h-48 rounded-xl overflow-hidden border">
                  <MockMapWithTiles
                    deliveryLocation={deliveryCoords}
                    deliveryAddress={address || "Your delivery location"}
                    zoom={15}
                    interactive={true}
                    onLocationSelect={(lat, lng) => {
                      setDeliveryCoords({ lat, lng });
                      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <SimpleLocationPicker
                    onLocationSelect={(loc) => {
                      setAddress(loc.address);
                      setDeliveryCoords({ lat: loc.lat, lng: loc.lng });
                    }}
                    initialLocation={deliveryCoords}
                    trigger={
                      <Button variant="outline" className="gap-2 flex-1">
                        <MapPin className="w-4 h-4" />
                        Pick on Map
                      </Button>
                    }
                  />
                  {profile?.default_address && address !== profile.default_address && (
                    <Button
                      variant="ghost"
                      onClick={() => setAddress(profile.default_address || "")}
                      className="text-primary flex-1"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Use saved
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Special Instructions (Optional)
              </h2>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add cooking instructions, allergies, or delivery preferences..."
                rows={3}
              />
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-2xl p-6 swiggy-shadow animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h2>

              {items[0] && (
                <p className="text-muted-foreground mb-4">
                  From {items[0].restaurantName}
                </p>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 border-2 flex items-center justify-center ${
                        item.isVeg ? "border-swiggy-green" : "border-destructive"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.isVeg ? "bg-swiggy-green" : "bg-destructive"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">
                        {item.name} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Bill Details */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 swiggy-shadow sticky top-24 animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Bill Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="text-foreground">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span
                    className={deliveryFee === 0 ? "text-swiggy-green" : "text-foreground"}
                  >
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-foreground">₹{platformFee}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-foreground mb-6">
                <span>To Pay</span>
                <span>₹{grandTotal}</span>
              </div>

              {deliveryFee === 0 && (
                <div className="bg-swiggy-green-light text-swiggy-green text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  You saved ₹40 on delivery!
                </div>
              )}

              <Button
                className="w-full bg-swiggy-green hover:bg-swiggy-green/90 text-white font-bold py-6"
                onClick={handlePlaceOrder}
                disabled={isPlacing || !address.trim()}
              >
                {isPlacing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  `Place Order • ₹${grandTotal}`
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By placing this order, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
