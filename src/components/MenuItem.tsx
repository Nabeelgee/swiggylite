import React from "react";
import { Plus, Minus } from "lucide-react";
import { MenuItem as MenuItemType } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

interface MenuItemProps {
  item: MenuItemType;
  restaurantId: string;
  restaurantName: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, restaurantId, restaurantName }) => {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  return (
    <div className="flex gap-4 py-5 border-b border-border last:border-b-0 animate-fade-in">
      {/* Item Details */}
      <div className="flex-1">
        {/* Veg/Non-Veg Icon */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-4 h-4 border-2 flex items-center justify-center ${
              item.isVeg ? "border-swiggy-green" : "border-destructive"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? "bg-swiggy-green" : "bg-destructive"
              }`}
            />
          </div>
          {item.isBestseller && (
            <span className="text-xs font-medium text-primary bg-swiggy-orange-light px-2 py-0.5 rounded">
              ★ Bestseller
            </span>
          )}
        </div>

        {/* Name & Description */}
        <h4 className="font-semibold text-foreground">{item.name}</h4>
        <p className="text-sm font-medium text-foreground mt-1">₹{item.price}</p>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Image & Add Button */}
      <div className="relative flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-28 h-24 sm:w-32 sm:h-28 object-cover rounded-lg"
          />
        ) : (
          <div className="w-28 h-24 sm:w-32 sm:h-28 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-3xl">{item.isVeg ? "🥗" : "🍗"}</span>
          </div>
        )}

        {/* Add/Quantity Button */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          {quantity === 0 ? (
            <Button
              onClick={() => addItem(item, restaurantId, restaurantName)}
              className="bg-card text-primary border-2 border-primary hover:bg-swiggy-orange-light font-bold shadow-md px-6"
              size="sm"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center bg-primary rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="p-2 hover:bg-primary/80 transition-colors"
              >
                <Minus className="w-4 h-4 text-primary-foreground" />
              </button>
              <span className="px-3 font-bold text-primary-foreground">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="p-2 hover:bg-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
