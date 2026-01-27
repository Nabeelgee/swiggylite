import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, User, Clock, MapPin, ChevronDown, Heart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Cart from "./Cart";
import GlobalSearch from "./GlobalSearch";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const TopNavBar: React.FC = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { user, profile } = useAuth();
  const totalItems = getTotalItems();
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Heart, label: "Favorites", path: "/favorites" },
    { icon: Clock, label: "Orders", path: "/orders" },
  ];

  // Hide on certain pages
  const hiddenPaths = ["/auth", "/admin"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-card/70 backdrop-blur-xl border-b border-border/50 shadow-lg"
            : "bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                <span className="text-primary-foreground text-xl font-bold">Q</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-primary">
                QuickBite
              </span>
            </Link>

            {/* Location (Desktop) */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground text-sm">Koramangala, Bangalore</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.path === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </Button>

              {/* Cart */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0">
                  <Cart />
                </SheetContent>
              </Sheet>

              {/* User */}
              <Link to={user ? "/profile" : "/auth"}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user && profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {showSearch && (
            <div className="pb-4 animate-fade-in">
              <GlobalSearch placeholder="Search restaurants, cuisines, dishes..." />
            </div>
          )}

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 animate-fade-in">
              <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-2 border border-border/50">
                {/* Location */}
                <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">Koramangala, Bangalore</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
                
                <div className="h-px bg-border/50 my-1" />

                {navItems.map((item) => {
                  const isActive = item.path === "/" 
                    ? location.pathname === "/" 
                    : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default TopNavBar;
