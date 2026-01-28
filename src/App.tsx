import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import TopNavBar from "@/components/TopNavBar";
import MobileTabBar from "@/components/MobileTabBar";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import Index from "./pages/Index";
import RestaurantPage from "./pages/RestaurantPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import CheckoutPage from "./pages/CheckoutPage";
import FavoritesPage from "./pages/FavoritesPage";
import PartnerDashboard from "./pages/PartnerDashboard";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminMenuItems from "./pages/admin/AdminMenuItems";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliverySimulator from "./pages/admin/AdminDeliverySimulator";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <div className="min-h-screen bg-background pb-16 md:pb-0">
                <TopNavBar />
                <OfflineIndicator />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/restaurant/:id" element={<RestaurantPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/order/:orderId" element={<OrderTrackingPage />} />
                  <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/partner" element={<PartnerDashboard />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="restaurants" element={<AdminRestaurants />} />
                    <Route path="menu" element={<AdminMenuItems />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="simulator" element={<AdminDeliverySimulator />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <MobileTabBar />
              <InstallPrompt />
            </BrowserRouter>
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
