import React from "react";
import { Link } from "react-router-dom";
import { Store, UtensilsCrossed, Package, TrendingUp, ArrowRight } from "lucide-react";
import { useAllRestaurants, useAllOrders, useAllMenuItems } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminDashboard: React.FC = () => {
  const { data: restaurants, isLoading: restaurantsLoading } = useAllRestaurants();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: menuItems, isLoading: menuLoading } = useAllMenuItems();

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const pendingOrders = orders?.filter(o => o.status === "placed" || o.status === "preparing").length || 0;

  const stats = [
    {
      title: "Total Restaurants",
      value: restaurants?.length || 0,
      icon: Store,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/admin/restaurants",
    },
    {
      title: "Menu Items",
      value: menuItems?.length || 0,
      icon: UtensilsCrossed,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/admin/menu",
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/admin/orders",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/orders",
    },
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome to Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage your restaurants, menu items, and orders</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {restaurantsLoading || ordersLoading || menuLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/restaurants">
              <Button variant="outline" className="w-full justify-between">
                Add New Restaurant
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/menu">
              <Button variant="outline" className="w-full justify-between">
                Add Menu Item
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="outline" className="w-full justify-between">
                View All Orders
                {pendingOrders > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {pendingOrders} pending
                  </span>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.restaurant_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground text-sm">₹{order.total_amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "delivered" 
                          ? "bg-swiggy-green-light text-swiggy-green"
                          : order.status === "placed"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
