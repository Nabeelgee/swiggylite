import React, { useState } from "react";
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
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface AdminChartsProps {
  orders: Tables<"orders">[];
}

const COLORS = ["#FC8019", "#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"];

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

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Calculate growth percentages (mock)
  const revenueGrowth = 12.5;
  const orderGrowth = 8.3;

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
                    <stop offset="5%" stopColor="hsl(28, 97%, 54%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(28, 97%, 54%)" stopOpacity={0} />
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
                  stroke="hsl(28, 97%, 54%)"
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
