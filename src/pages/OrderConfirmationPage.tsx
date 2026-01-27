import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Package, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
import confetti from "canvas-confetti";

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId || "");

  useEffect(() => {
    // Trigger confetti animation on mount
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff6b35", "#00b37e", "#ffb800"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff6b35", "#00b37e", "#ffb800"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-swiggy-green-light rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle className="w-12 h-12 text-swiggy-green" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Thank You for Ordering! 🎉
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your order has been placed successfully
          </p>

          {order && (
            <div className="bg-card rounded-2xl p-6 swiggy-shadow text-left mb-8">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{order.restaurant_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">30-40 minutes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-foreground">₹{order.total_amount}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate(`/order/${orderId}`)}
              className="flex-1 bg-primary hover:bg-primary/90 gap-2"
            >
              Track Your Order
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Continue Ordering
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmationPage;
