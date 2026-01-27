import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useDeliveryLocation } from "@/context/LocationContext";
import RestaurantCard from "./RestaurantCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const filters = [
  "Relevance",
  "Delivery Time",
  "Rating",
  "Cost: Low to High",
  "Cost: High to Low",
];

const RestaurantList: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("Relevance");
  const [showVegOnly, setShowVegOnly] = useState(false);
  const { selectedLocation } = useDeliveryLocation();
  
  const { data: restaurants, isLoading, error } = useRestaurants();

  const filteredAndSortedRestaurants = useMemo(() => {
    if (!restaurants) return [];

    let filtered = showVegOnly
      ? restaurants.filter((r) => r.is_veg)
      : restaurants;

    // Filter by location if specified
    if (selectedLocation.trim()) {
      const locationLower = selectedLocation.toLowerCase().trim();
      filtered = filtered.filter((r) => {
        const name = r.name?.toLowerCase() || "";
        const address = r.address?.toLowerCase() || "";
        const cuisines = r.cuisines?.join(" ").toLowerCase() || "";
        return name.includes(locationLower) || address.includes(locationLower) || cuisines.includes(locationLower);
      });
    }

    // Sort based on active filter
    switch (activeFilter) {
      case "Rating":
        return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "Delivery Time":
        return [...filtered].sort((a, b) => {
          const getMinutes = (time: string | null) => {
            const match = time?.match(/\d+/);
            return match ? parseInt(match[0]) : 999;
          };
          return getMinutes(a.delivery_time) - getMinutes(b.delivery_time);
        });
      case "Cost: Low to High":
        return [...filtered].sort((a, b) => {
          const getCost = (cost: string | null) => {
            const match = cost?.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          };
          return getCost(a.cost_for_two) - getCost(b.cost_for_two);
        });
      case "Cost: High to Low":
        return [...filtered].sort((a, b) => {
          const getCost = (cost: string | null) => {
            const match = cost?.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          };
          return getCost(b.cost_for_two) - getCost(a.cost_for_two);
        });
      default:
        return filtered;
    }
  }, [restaurants, showVegOnly, activeFilter, selectedLocation]);

  if (error) {
    return (
      <section className="py-6 sm:py-8 bg-secondary/30" data-section="restaurants">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-destructive text-lg">Failed to load restaurants</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 bg-secondary/30" data-section="restaurants">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {selectedLocation.trim() 
              ? `Restaurants in ${selectedLocation}` 
              : "Restaurants with online food delivery"}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide">
          <Button
            variant={showVegOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVegOnly(!showVegOnly)}
            className="flex-shrink-0 rounded-full"
          >
            <span className="w-3 h-3 rounded-full bg-swiggy-green mr-2" />
            Pure Veg
          </Button>
          
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="flex-shrink-0 rounded-full"
            >
              {filter}
              {filter === "Relevance" && <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          ))}
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <div className="p-3 sm:p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
            {filteredAndSortedRestaurants.map((restaurant, index) => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={{
                  id: restaurant.id,
                  name: restaurant.name,
                  image: restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
                  rating: restaurant.rating || 4.0,
                  deliveryTime: restaurant.delivery_time || "30-35 mins",
                  cuisines: restaurant.cuisines || [],
                  costForTwo: restaurant.cost_for_two || "₹500 for two",
                  discount: restaurant.discount || undefined,
                  isVeg: restaurant.is_veg || false,
                  promoted: restaurant.is_promoted || false,
                }}
                index={index} 
              />
            ))}
          </div>
        )}

        {!isLoading && filteredAndSortedRestaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {selectedLocation.trim() 
                ? `No restaurants found in "${selectedLocation}". Try a different location.`
                : "No restaurants found matching your criteria"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantList;
