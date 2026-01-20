import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, ChevronRight, Package } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: orders, isLoading } = useOrders();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-swiggy-green text-white";
      case "cancelled":
        return "bg-destructive text-white";
      case "on_the_way":
      case "picked_up":
        return "bg-primary text-white";
      default:
        return "bg-secondary text-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">Your Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't placed any orders yet.
            </p>
            <Link to="/">
              <Button>Browse Restaurants</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const isActive = !["delivered", "cancelled"].includes(order.status);

              return (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className="block animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`bg-card rounded-2xl p-4 sm:p-6 swiggy-shadow hover:swiggy-shadow-hover transition-all ${
                      isActive ? "border-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-swiggy-orange-light rounded-xl flex items-center justify-center text-xl">
                            🍔
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {order.restaurant_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ₹{Number(order.total_amount) + Number(order.delivery_fee || 0) + Number(order.platform_fee || 0)}
                          </span>
                        </div>

                        {isActive && order.estimated_delivery_time && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-swiggy-green">
                            <Clock className="w-4 h-4" />
                            <span>
                              Arriving by{" "}
                              {format(new Date(order.estimated_delivery_time), "h:mm a")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{order.delivery_address}</span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>

                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          Track Order
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
