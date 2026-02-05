import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShoppingBag,
  UtensilsCrossed,
  Download
} from "lucide-react";
import { format, subDays, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { toast } from "sonner";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AdminReports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");

  // Fetch orders with items for reports
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-reports", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case "daily":
          startDate = startOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case "monthly":
          startDate = startOfMonth(now);
          break;
      }

      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          restaurant_name
        `)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return orders || [];
    },
  });

  // Fetch order items for dish analytics
  const { data: dishData } = useQuery({
    queryKey: ["admin-dish-reports", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case "daily":
          startDate = startOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case "monthly":
          startDate = startOfMonth(now);
          break;
      }

      const { data: items, error } = await supabase
        .from("order_items")
        .select(`
          name,
          quantity,
          price,
          order_id,
          orders!inner(created_at)
        `)
        .gte("orders.created_at", startDate.toISOString());

      if (error) throw error;
      
      // Aggregate dish data
      const dishMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      items?.forEach((item) => {
        const existing = dishMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        dishMap.set(item.name, existing);
      });

      return Array.from(dishMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!ordersData) return { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, deliveredOrders: 0 };
    
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveredOrders = ordersData.filter(o => o.status === "delivered").length;

    return { totalOrders, totalRevenue, avgOrderValue, deliveredOrders };
  }, [ordersData]);

  // Orders by status for pie chart
  const statusData = React.useMemo(() => {
    if (!ordersData) return [];
    
    const statusMap = new Map<string, number>();
    ordersData.forEach((order) => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }));
  }, [ordersData]);

  // Revenue by day/hour
  const revenueChartData = React.useMemo(() => {
    if (!ordersData) return [];
    
    const groupMap = new Map<string, number>();
    ordersData.forEach((order) => {
      const date = new Date(order.created_at);
      const key = timeRange === "daily" 
        ? format(date, "HH:00")
        : timeRange === "weekly"
        ? format(date, "EEE")
        : format(date, "dd MMM");
      
      const current = groupMap.get(key) || 0;
      groupMap.set(key, current + Number(order.total_amount));
    });

    return Array.from(groupMap.entries()).map(([time, revenue]) => ({
      time,
      revenue: Math.round(revenue),
    }));
  }, [ordersData, timeRange]);

  const getTimeLabel = () => {
    switch (timeRange) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
    }
  };

  const downloadReportCSV = () => {
    if (!ordersData || ordersData.length === 0) {
      toast.error("No data to download");
      return;
    }

    const headers = ["Order ID", "Restaurant", "Amount", "Status", "Date"];
    const rows = ordersData.map(order => [
      order.id,
      order.restaurant_name,
      order.total_amount,
      order.status,
      format(new Date(order.created_at), "yyyy-MM-dd HH:mm:ss")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quickbite-report-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const downloadDishReportCSV = () => {
    if (!dishData || dishData.length === 0) {
      toast.error("No dish data to download");
      return;
    }

    const headers = ["Rank", "Dish Name", "Quantity Sold", "Revenue"];
    const rows = dishData.map((dish, index) => [
      index + 1,
      dish.name,
      dish.quantity,
      dish.revenue
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quickbite-dishes-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Dish report downloaded successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">View order and dish performance</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={downloadReportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </Button>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="daily" className="gap-2">
                <Calendar className="w-4 h-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-2">
                <Calendar className="w-4 h-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <Calendar className="w-4 h-4" />
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{Math.round(stats.avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.deliveredOrders}</p>
                <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Dishes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Top Selling Dishes
            </CardTitle>
            <Button onClick={downloadDishReportCSV} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dishData && dishData.length > 0 ? (
            <div className="space-y-4">
              {dishData.map((dish, index) => (
                <div 
                  key={dish.name} 
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dish.quantity} orders · ₹{dish.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No dish data available for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
