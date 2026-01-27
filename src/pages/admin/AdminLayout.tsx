import React, { useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Store, 
  UtensilsCrossed, 
  Package, 
  Truck,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  Home
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin, useAllOrders } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", badge: null },
  { icon: Store, label: "Restaurants", path: "/admin/restaurants", badge: null },
  { icon: UtensilsCrossed, label: "Menu Items", path: "/admin/menu", badge: null },
  { icon: Package, label: "Orders", path: "/admin/orders", badge: "orders" },
  { icon: Truck, label: "Simulator", path: "/admin/simulator", badge: null },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: orders } = useAllOrders();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(() => 
    document.documentElement.classList.contains("dark")
  );

  const pendingOrders = orders?.filter(o => 
    ["placed", "confirmed", "preparing"].includes(o.status)
  ).length || 0;

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && user && isAdmin === false) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentPage = navItems.find(item => 
    location.pathname === item.path || 
    (item.path !== "/admin" && location.pathname.startsWith(item.path))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      {/* Mobile sidebar overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:fixed top-0 left-0 z-50 h-screen w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 shadow-2xl lg:shadow-xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <span className="text-primary-foreground text-xl font-bold">S</span>
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">Swiggy</span>
                <span className="text-xs text-primary font-medium block">Admin Console</span>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden hover:bg-muted"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            const showBadge = item.badge === "orders" && pendingOrders > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="font-medium flex-1">{item.label}</span>
                {showBadge && (
                  <Badge 
                    variant={isActive ? "secondary" : "destructive"}
                    className="text-xs px-2 py-0.5"
                  >
                    {pendingOrders}
                  </Badge>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-xl">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">
                {profile?.full_name || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/" className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Site</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Page title - mobile */}
            <div className="lg:hidden flex-1">
              <h1 className="font-semibold text-foreground">
                {currentPage?.label || "Admin"}
              </h1>
            </div>

            {/* Search - desktop */}
            <div className="hidden lg:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="w-5 h-5" />
                {pendingOrders > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingOrders > 9 ? "9+" : pendingOrders}
                  </span>
                )}
              </Button>

              {/* Desktop avatar */}
              <Avatar className="hidden lg:flex h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Breadcrumb - desktop */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/admin" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            {currentPage && currentPage.path !== "/admin" && (
              <>
                <span>/</span>
                <span className="text-foreground font-medium">{currentPage.label}</span>
              </>
            )}
          </div>

          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 px-4 lg:px-6 py-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Swiggy Admin. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
