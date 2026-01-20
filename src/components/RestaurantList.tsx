import React, { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { restaurants } from "@/data/restaurants";
import RestaurantCard from "./RestaurantCard";
import { Button } from "@/components/ui/button";

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

  const filteredRestaurants = showVegOnly
    ? restaurants.filter((r) => r.isVeg)
    : restaurants;

  return (
    <section className="py-6 sm:py-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Restaurants with online food delivery
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
          {filteredRestaurants.map((restaurant, index) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No restaurants found matching your criteria
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantList;
