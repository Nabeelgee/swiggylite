import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, MapPin, User, Phone, CreditCard, Banknote, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.default_address || "");
  const [paymentMethod, setPaymentMethod] = useState<"gpay" | "cod">("cod");

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 0 ? (totalPrice > 500 ? 0 : 40) : 0;
  const platformFee = totalPrice > 0 ? 5 : 0;
  const grandTotal = totalPrice + deliveryFee + platformFee;

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowCheckoutForm(true);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please login to place order");
      navigate("/auth");
      return;
    }

    // Validation
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          restaurant_id: items[0]?.restaurantId || null,
          restaurant_name: items[0]?.restaurantName || "Restaurant",
          delivery_address: address,
          total_amount: grandTotal,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
          special_instructions: paymentMethod === "gpay" ? "Payment: Google Pay" : "Payment: Cash on Delivery",
          status: "placed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        is_veg: item.isVeg,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create order tracking
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "placed",
        status_message: "Order placed successfully",
      });

      // Clear cart and navigate
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order/${order.id}/confirmation`);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Cart</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-center text-sm">
            Good food is always cooking! Go ahead, order some yummy items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {showCheckoutForm ? "Checkout" : "Cart"}
          </h2>
          {!showCheckoutForm && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1" />Clear
            </Button>
          )}
          {showCheckoutForm && (
            <Button variant="ghost" size="sm" onClick={() => setShowCheckoutForm(false)}>
              Back to Cart
            </Button>
          )}
        </div>
        {items[0] && <p className="text-sm text-muted-foreground mt-1">From {items[0].restaurantName}</p>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cart Items */}
        {!showCheckoutForm && (
          <div className="p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
                <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? "border-swiggy-green" : "border-destructive"}`}>
                  <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-swiggy-green" : "bg-destructive"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₹{item.price * item.quantity}</p>
                </div>
                <div className="flex items-center bg-primary rounded overflow-hidden">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-primary/80 transition-colors">
                    <Minus className="w-3 h-3 text-primary-foreground" />
                  </button>
                  <span className="px-2 text-sm font-bold text-primary-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-primary/80 transition-colors">
                    <Plus className="w-3 h-3 text-primary-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Checkout Form */}
        {showCheckoutForm && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Delivery Address
              </Label>
              <Input
                id="address"
                placeholder="Enter your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "gpay" | "cod")}>
                <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === "gpay" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="gpay" id="gpay" />
                  <Label htmlFor="gpay" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Google Pay</p>
                      <p className="text-xs text-muted-foreground">UPI: 9360646541@slc</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </div>

      {/* Bill Details */}
      <div className="border-t border-border p-4 bg-secondary/30">
        <h4 className="font-semibold text-foreground mb-3">Bill Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span className="text-foreground">₹{totalPrice}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span className={deliveryFee === 0 ? "text-primary" : "text-foreground"}>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">₹{platformFee}</span></div>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold text-foreground"><span>To Pay</span><span>₹{grandTotal}</span></div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-border">
        {!showCheckoutForm ? (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6" 
            onClick={handleProceedToCheckout}
          >
            {user ? "Proceed to Pay" : "Login to Checkout"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6" 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                {paymentMethod === "gpay" ? (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ₹{grandTotal} with GPay
                  </>
                ) : (
                  <>
                    <Banknote className="w-5 h-5 mr-2" />
                    Place Order (COD) - ₹{grandTotal}
                  </>
                )}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Cart;
