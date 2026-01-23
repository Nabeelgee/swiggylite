import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useFavoriteRestaurants, useToggleFavorite } from "@/hooks/useFavorites";

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavoriteRestaurants();
  const toggleFavorite = useToggleFavorite();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view favorites</h1>
          <p className="text-muted-foreground mb-6">
            Save your favorite restaurants for quick access
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const handleRemoveFavorite = (restaurantId: string) => {
    toggleFavorite.mutate({ restaurantId, isFavorite: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">My Favorites</h1>
        </div>

        {!favorites || favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring restaurants and save your favorites!
            </p>
            <Button onClick={() => navigate("/")}>Browse Restaurants</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav: any) => {
              const restaurant = fav.restaurants;
              if (!restaurant) return null;

              return (
                <Card
                  key={fav.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className="relative">
                    <img
                      src={restaurant.image_url || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(restaurant.id);
                      }}
                    >
                      <Heart className="h-5 w-5 text-primary fill-primary" />
                    </Button>
                    {restaurant.discount && (
                      <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                        {restaurant.discount}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm">
                        ★ {restaurant.rating || "4.0"}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      {restaurant.cuisines?.join(", ") || "Multiple cuisines"}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{restaurant.cost_for_two || "₹500 for two"}</span>
                      <span>{restaurant.delivery_time || "25-30 mins"}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
