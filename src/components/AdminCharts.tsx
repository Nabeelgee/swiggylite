import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, MapPin, Crown, Flame } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface AdminChartsProps {
  orders: Tables<"orders">[];
}

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6", "#F97316"];

// Helper function to extract location/area from delivery address
const extractLocation = (address: string): string => {
  if (!address) return "Unknown";
  
  // Common patterns to extract area names
  const parts = address.split(",").map(p => p.trim());
  
  // Try to find a meaningful location name
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    // Skip common prefixes like house numbers, floor numbers
    if (/^\d+/.test(part) || lowerPart.includes("floor") || lowerPart.includes("flat")) {
      continue;
    }
    // Return first meaningful part (likely area/locality name)
    if (part.length > 2 && part.length < 40) {
      return part;
    }
  }
  
  // Fallback: return first 30 chars
  return address.slice(0, 30) + (address.length > 30 ? "..." : "");
};

const AdminCharts: React.FC<AdminChartsProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Generate mock data based on orders for demo
  const generateChartData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Use actual order data if available, otherwise generate mock data
      const dayOrders = orders?.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      }) || [];

      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) || 
                      Math.floor(Math.random() * 15000 + 5000);
      const orderCount = dayOrders.length || Math.floor(Math.random() * 50 + 10);

      data.push({
        date: dateStr,
        revenue,
        orders: orderCount,
        avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      });
    }

    return data;
  };

  const chartData = generateChartData();

  // Order status distribution
  const statusData = [
    { name: "Delivered", value: orders?.filter((o) => o.status === "delivered").length || 45 },
    { name: "On the Way", value: orders?.filter((o) => o.status === "on_the_way").length || 12 },
    { name: "Preparing", value: orders?.filter((o) => o.status === "preparing").length || 8 },
    { name: "Cancelled", value: orders?.filter((o) => o.status === "cancelled").length || 3 },
  ];

  // Location-based analytics
  const locationAnalytics = useMemo(() => {
    const locationMap = new Map<string, { orders: number; revenue: number; restaurants: Set<string> }>();

    orders?.forEach((order) => {
      const location = extractLocation(order.delivery_address);
      const existing = locationMap.get(location) || { orders: 0, revenue: 0, restaurants: new Set<string>() };
      existing.orders += 1;
      existing.revenue += Number(order.total_amount);
      existing.restaurants.add(order.restaurant_name);
      locationMap.set(location, existing);
    });

    // Convert to array and sort by order count
    const sortedLocations = Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        orders: data.orders,
        revenue: data.revenue,
        restaurants: data.restaurants.size,
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8); // Top 8 locations

    return sortedLocations;
  }, [orders]);

  // Top dishes/restaurants by location (mock data if no real data)
  const topLocationData = useMemo(() => {
    if (locationAnalytics.length === 0) {
      // Return demo data
      return [
        { location: "Melvisharam", orders: 156, revenue: 45600, restaurants: 4 },
        { location: "Koramangala", orders: 134, revenue: 42300, restaurants: 8 },
        { location: "Indiranagar", orders: 128, revenue: 39800, restaurants: 6 },
        { location: "HSR Layout", orders: 98, revenue: 31200, restaurants: 5 },
        { location: "Whitefield", orders: 87, revenue: 28400, restaurants: 4 },
        { location: "Jayanagar", orders: 76, revenue: 24100, restaurants: 5 },
        { location: "Electronic City", orders: 65, revenue: 19800, restaurants: 3 },
        { location: "BTM Layout", orders: 54, revenue: 17200, restaurants: 4 },
      ];
    }
    return locationAnalytics;
  }, [locationAnalytics]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Calculate growth percentages (mock)
  const revenueGrowth = 12.5;
  const orderGrowth = 8.3;

  const maxOrders = Math.max(...topLocationData.map(l => l.orders));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2">
        {(["7d", "30d", "90d"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className="rounded-full"
          >
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
          </Button>
        ))}
      </div>

      {/* Top Ordering Locations - NEW SECTION */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Top Ordering Locations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Areas with highest order volume
              </p>
            </div>
            <Badge variant="secondary" className="w-fit gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              {topLocationData.length} Active Areas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Location Chart */}
          <div className="h-[280px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topLocationData} 
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="location" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "orders") return [value, "Total Orders"];
                    if (name === "revenue") return [`₹${value.toLocaleString()}`, "Revenue"];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="hsl(var(--primary))"
                  radius={[0, 6, 6, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Location Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topLocationData.slice(0, 4).map((location, index) => (
              <div
                key={location.location}
                className={`relative p-4 rounded-2xl border transition-all hover:shadow-lg ${
                  index === 0 
                    ? "bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border-primary/30" 
                    : "bg-muted/30 border-border/50"
                }`}
              >
                {index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate text-sm">
                      {location.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-foreground">
                        {location.orders}
                      </span>
                      <span className="text-xs text-muted-foreground">orders</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{location.revenue.toLocaleString()} • {location.restaurants} restaurants
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(location.orders / maxOrders) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* See All Locations */}
          {topLocationData.length > 4 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topLocationData.slice(4).map((location, index) => (
                  <div 
                    key={location.location}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: COLORS[(index + 4) % COLORS.length] }}
                    >
                      {index + 5}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {location.location}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {location.orders} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Revenue Overview
              </CardTitle>
              <p className="text-2xl font-bold mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {revenueGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(revenueGrowth)}% vs last period
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Bar Chart */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-500" />
                  Order Trends
                </CardTitle>
                <p className="text-2xl font-bold mt-1">{totalOrders}</p>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  orderGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {orderGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(orderGrowth)}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Orders"]}
                  />
                  <Bar
                    dataKey="orders"
                    fill="hsl(262, 83%, 58%)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {statusData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Order Value */}
      <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-3xl font-bold text-foreground">₹{avgOrderValue}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCharts;
