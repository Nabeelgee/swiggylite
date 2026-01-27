import React from "react";
import { Link } from "react-router-dom";
import { 
  Store, 
  UtensilsCrossed, 
  Package, 
  TrendingUp, 
  ArrowRight, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  MoreHorizontal,
  BarChart3
} from "lucide-react";
import { useAllRestaurants, useAllOrders, useAllMenuItems } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import AdminCharts from "@/components/AdminCharts";
import { DashboardStatsSkeleton, ChartSkeleton } from "@/components/SkeletonLoaders";

const AdminDashboard: React.FC = () => {
  const { data: restaurants, isLoading: restaurantsLoading } = useAllRestaurants();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: menuItems, isLoading: menuLoading } = useAllMenuItems();

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const pendingOrders = orders?.filter(o => ["placed", "confirmed"].includes(o.status)).length || 0;
  const preparingOrders = orders?.filter(o => o.status === "preparing").length || 0;
  const deliveredOrders = orders?.filter(o => o.status === "delivered").length || 0;

  const stats = [
    {
      title: "Total Restaurants",
      value: restaurants?.length || 0,
      icon: Store,
      trend: "+12%",
      trendUp: true,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      link: "/admin/restaurants",
    },
    {
      title: "Menu Items",
      value: menuItems?.length || 0,
      icon: UtensilsCrossed,
      trend: "+8%",
      trendUp: true,
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      link: "/admin/menu",
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: Package,
      trend: "+23%",
      trendUp: true,
      color: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      link: "/admin/orders",
    },
    {
      title: "Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      trend: "+18%",
      trendUp: true,
      color: "from-primary to-primary/80",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      link: "/admin/orders",
    },
  ];

  const recentOrders = orders?.slice(0, 6) || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "placed":
        return { 
          color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", 
          icon: Clock,
          label: "Placed"
        };
      case "confirmed":
        return { 
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", 
          icon: CheckCircle,
          label: "Confirmed"
        };
      case "preparing":
        return { 
          color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", 
          icon: UtensilsCrossed,
          label: "Preparing"
        };
      case "on_the_way":
        return { 
          color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", 
          icon: Truck,
          label: "On the Way"
        };
      case "delivered":
        return { 
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", 
          icon: CheckCircle,
          label: "Delivered"
        };
      case "cancelled":
        return { 
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", 
          icon: AlertCircle,
          label: "Cancelled"
        };
      default:
        return { 
          color: "bg-muted text-muted-foreground", 
          icon: Clock,
          label: status
        };
    }
  };

  const isLoading = restaurantsLoading || ordersLoading || menuLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <Link to="/admin/orders">
          <Button className="gap-2 shadow-lg shadow-primary/25">
            <Package className="w-4 h-4" />
            View Orders
            {pendingOrders > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingOrders} new
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {stat.title}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Order Status Overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {pendingOrders}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Pending
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4 text-center">
            <UtensilsCrossed className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {preparingOrders}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Preparing
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {deliveredOrders}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content - Charts & Orders */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Recent Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AdminCharts orders={orders || []} />
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-0">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Link 
                        key={order.id} 
                        to={`/admin/orders`}
                        className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                          🍔
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm truncate">
                              {order.restaurant_name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              #{order.id.slice(0, 6)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-foreground text-sm">
                            ₹{Number(order.total_amount).toLocaleString()}
                          </p>
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/restaurants" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4 px-4 bg-gradient-to-r from-blue-500/5 to-transparent border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Add Restaurant</p>
                        <p className="text-xs text-muted-foreground">Create new listing</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>

                <Link to="/admin/menu" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4 px-4 bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Add Menu Item</p>
                        <p className="text-xs text-muted-foreground">Add dishes to menu</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>

                <Link to="/admin/simulator" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4 px-4 bg-gradient-to-r from-violet-500/5 to-transparent border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-violet-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Test Tracking</p>
                        <p className="text-xs text-muted-foreground">Simulate delivery</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tip Card */}
            <Card className="mt-4 border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Pro Tip</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the simulator to test your delivery tracking before going live with real orders.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
