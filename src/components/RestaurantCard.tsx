import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import { Restaurant } from "@/types";

interface RestaurantCardProps {
  restaurant: Restaurant;
  index?: number;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, index = 0 }) => {
  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="group block animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="bg-card rounded-2xl overflow-hidden swiggy-shadow hover:swiggy-shadow-hover transition-all duration-300 group-hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Discount Badge */}
          {restaurant.discount && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-card text-primary font-bold text-xs sm:text-sm px-2 py-1 rounded shadow-md">
                {restaurant.discount}
              </span>
            </div>
          )}
          
          {/* Promoted Badge */}
          {restaurant.promoted && (
            <div className="absolute top-3 left-3">
              <span className="bg-foreground/80 text-card text-xs px-2 py-0.5 rounded">
                Promoted
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          
          {/* Rating and Time */}
          <div className="flex items-center gap-3 mt-1.5 sm:mt-2">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-swiggy-green rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {restaurant.rating}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{restaurant.deliveryTime}</span>
            </div>
          </div>
          
          {/* Cuisines */}
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
            {restaurant.cuisines.join(", ")}
          </p>
          
          {/* Cost */}
          <p className="text-sm text-muted-foreground mt-0.5">
            {restaurant.costForTwo}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
