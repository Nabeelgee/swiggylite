import React, { useState } from "react";
import { Search, MapPin, ChevronDown, ShoppingBag, User, Menu, X, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cart from "./Cart";
import GlobalSearch from "./GlobalSearch";

const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const { user, profile, signOut } = useAuth();
  const [location] = useState("Koramangala, Bangalore");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const totalItems = getTotalItems();

  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xl font-bold">S</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-foreground">Swiggy</span>
            </div>
          </Link>

          <button className="hidden md:flex items-center gap-2 text-sm hover:text-primary transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground line-clamp-1 max-w-[200px]">{location}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex-1 max-w-md hidden lg:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:block text-sm font-medium">
                      {profile?.full_name?.split(" ")[0] || "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">👤 My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">📦 My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="cursor-pointer">❤️ My Favorites</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">⚙️ Admin Panel</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                    🚪 Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-sm font-medium">Sign In</span>
                </Button>
              </Link>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="hidden sm:block text-sm font-medium">Cart</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0">
                <Cart />
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {showMobileSearch && (
          <div className="lg:hidden px-4 pb-3 animate-fade-in">
            <GlobalSearch placeholder="Search restaurants, cuisines, dishes..." />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
