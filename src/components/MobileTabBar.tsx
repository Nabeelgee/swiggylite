import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Cart from "./Cart";

interface TabItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  isCart?: boolean;
  badge?: number;
}

const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  const totalItems = getTotalItems();
  const [cartOpen, setCartOpen] = useState(false);

  const tabs: TabItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: ShoppingBag, label: "Cart", isCart: true, badge: totalItems },
    { icon: Clock, label: "Orders", path: "/orders" },
    { icon: User, label: "Account", path: user ? "/profile" : "/auth" },
  ];

  // Hide on certain pages
  const hiddenPaths = ["/auth", "/admin"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Glass container with rounded corners and margin */}
      <div className="mx-3 mb-3">
        <div className="bg-card/70 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl shadow-black/10">
          <div className="flex items-center justify-around h-16 px-2">
            {tabs.map((tab) => {
              if (tab.isCart) {
                return (
                  <Sheet key={tab.label} open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetTrigger asChild>
                      <button
                        className={cn(
                          "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-300 rounded-xl mx-0.5",
                          "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="relative">
                          <tab.icon className="w-5 h-5 relative z-10" />
                          {tab.badge && tab.badge > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in z-20 shadow-lg shadow-primary/30">
                              {tab.badge > 9 ? "9+" : tab.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium">{tab.label}</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
                      <Cart />
                    </SheetContent>
                  </Sheet>
                );
              }

              const isActive =
                tab.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(tab.path?.split("?")[0] || "");

              return (
                <Link
                  key={tab.label}
                  to={tab.path || "/"}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-300 rounded-xl mx-0.5",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    {isActive && (
                      <div className="absolute -inset-2 bg-primary/10 rounded-xl animate-scale-in" />
                    )}
                    <tab.icon
                      className={cn(
                        "w-5 h-5 transition-all duration-300 relative z-10",
                        isActive && "scale-110"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-all",
                      isActive && "font-semibold"
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileTabBar;
