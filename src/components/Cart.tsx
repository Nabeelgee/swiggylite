import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, clearCart, getTotalPrice } = useCart();
  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 0 ? (totalPrice > 500 ? 0 : 40) : 0;
  const platformFee = totalPrice > 0 ? 5 : 0;
  const grandTotal = totalPrice + deliveryFee + platformFee;

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate("/checkout");
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
          <h2 className="text-lg font-bold text-foreground">Cart</h2>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-1" />Clear
          </Button>
        </div>
        {items[0] && <p className="text-sm text-muted-foreground mt-1">From {items[0].restaurantName}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? "border-swiggy-green" : "border-destructive"}`}>
              <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-swiggy-green" : "bg-destructive"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
              <p className="text-sm text-muted-foreground">₹{item.price * item.quantity}</p>
            </div>
            <div className="flex items-center bg-swiggy-green rounded overflow-hidden">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-swiggy-green/80 transition-colors">
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="px-2 text-sm font-bold text-white">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-swiggy-green/80 transition-colors">
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 bg-secondary/30">
        <h4 className="font-semibold text-foreground mb-3">Bill Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span className="text-foreground">₹{totalPrice}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span className={deliveryFee === 0 ? "text-swiggy-green" : "text-foreground"}>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">₹{platformFee}</span></div>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold text-foreground"><span>To Pay</span><span>₹{grandTotal}</span></div>
      </div>

      <div className="p-4 border-t border-border">
        <Button className="w-full bg-swiggy-green hover:bg-swiggy-green/90 text-white font-bold py-6" onClick={handleCheckout}>
          {user ? "Proceed to Checkout" : "Login to Checkout"}<ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Cart;
