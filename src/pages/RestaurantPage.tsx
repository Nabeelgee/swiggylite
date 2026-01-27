import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, Heart, Search } from "lucide-react";
import { useRestaurant, useMenuItems, MenuItem as DBMenuItem } from "@/hooks/useRestaurants";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/context/AuthContext";
import MenuItem from "@/components/MenuItem";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const RestaurantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = useRestaurant(id || "");
  const { data: menuItems, isLoading: menuLoading } = useMenuItems(id || "");
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const isFavorite = favorites?.some(fav => fav.restaurant_id === id) ?? false;

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error("Please sign in to add favorites");
      return;
    }
    if (id) {
      toggleFavorite.mutate({ restaurantId: id, isFavorite });
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    if (!searchQuery.trim()) return menuItems;
    
    const query = searchQuery.toLowerCase();
    return menuItems.filter(
      item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);

  const categorizedMenu = useMemo(() => {
    const categories: Record<string, DBMenuItem[]> = {};
    filteredMenuItems.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  }, [filteredMenuItems]);

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Restaurant not found</h1>
          <Link to="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to restaurants</span>
        </Link>

        {/* Restaurant Header */}
        <div className="bg-card rounded-2xl swiggy-shadow overflow-hidden animate-fade-in">
          <div className="relative h-48 sm:h-64 md:h-80">
            <img
              src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={toggleFavorite.isPending}
              className="absolute top-4 right-4 p-3 bg-card/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-card transition-colors"
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`} 
              />
            </button>
            
            {/* Restaurant Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                {restaurant.name}
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {restaurant.cuisines?.join(", ")}
              </p>
            </div>
          </div>

          {/* Info Bar */}
          <div className="p-4 sm:p-6 flex flex-wrap items-center gap-4 sm:gap-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-swiggy-green rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-semibold text-foreground">{restaurant.rating}</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>{restaurant.delivery_time}</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{restaurant.cost_for_two}</span>
            </div>

            {restaurant.discount && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-primary font-semibold">{restaurant.discount}</span>
              </>
            )}
          </div>

          {/* Search Menu */}
          <div className="p-4 sm:p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for dishes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-8">
          {menuLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : Object.keys(categorizedMenu).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No dishes found matching your search" : "No menu items available"}
              </p>
            </div>
          ) : (
            Object.entries(categorizedMenu).map(([category, items], index) => (
              <div
                key={category}
                className="mb-8 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  {category}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({items.length} items)
                  </span>
                </h2>
                
                <div className="bg-card rounded-2xl swiggy-shadow p-4 sm:p-6">
                  {items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={{
                        id: item.id,
                        name: item.name,
                        description: item.description || "",
                        price: item.price,
                        image: item.image_url || undefined,
                        isVeg: item.is_veg ?? true,
                        isBestseller: item.is_bestseller ?? false,
                        category: item.category,
                      }}
                      restaurantId={restaurant.id}
                      restaurantName={restaurant.name}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RestaurantPage;
