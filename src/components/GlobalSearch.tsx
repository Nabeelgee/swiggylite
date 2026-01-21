import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Utensils, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "restaurant" | "dish";
  id: string;
  name: string;
  subtitle: string;
  restaurantId?: string;
  image?: string | null;
}

const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];

      const searchTerm = `%${query.toLowerCase()}%`;
      const results: SearchResult[] = [];

      // Search restaurants by name and cuisines
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name, cuisines, image_url")
        .eq("is_active", true)
        .or(`name.ilike.${searchTerm}`)
        .limit(5);

      if (restaurants) {
        restaurants.forEach((r) => {
          results.push({
            type: "restaurant",
            id: r.id,
            name: r.name,
            subtitle: r.cuisines?.join(", ") || "Restaurant",
            image: r.image_url,
          });
        });
      }

      // Search by cuisine
      const { data: cuisineRestaurants } = await supabase
        .from("restaurants")
        .select("id, name, cuisines, image_url")
        .eq("is_active", true)
        .filter("cuisines", "cs", `{${query}}`)
        .limit(3);

      if (cuisineRestaurants) {
        cuisineRestaurants.forEach((r) => {
          if (!results.find((res) => res.id === r.id)) {
            results.push({
              type: "restaurant",
              id: r.id,
              name: r.name,
              subtitle: r.cuisines?.join(", ") || "Restaurant",
              image: r.image_url,
            });
          }
        });
      }

      // Search menu items
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, name, category, restaurant_id, image_url")
        .eq("is_available", true)
        .ilike("name", searchTerm)
        .limit(5);

      if (menuItems) {
        // Get restaurant names for menu items
        const restaurantIds = [...new Set(menuItems.map((m) => m.restaurant_id))];
        const { data: itemRestaurants } = await supabase
          .from("restaurants")
          .select("id, name")
          .in("id", restaurantIds);

        const restaurantMap = new Map(
          itemRestaurants?.map((r) => [r.id, r.name]) || []
        );

        menuItems.forEach((m) => {
          results.push({
            type: "dish",
            id: m.id,
            name: m.name,
            subtitle: restaurantMap.get(m.restaurant_id) || m.category,
            restaurantId: m.restaurant_id,
            image: m.image_url,
          });
        });
      }

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  placeholder = "Search for restaurants and food",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useGlobalSearch(query);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const targetId = result.type === "dish" ? result.restaurantId : result.id;
      navigate(`/restaurant/${targetId}`);
      setQuery("");
      setIsOpen(false);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-secondary rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : result.type === "restaurant" ? (
                      <Store className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Utensils className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {result.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.type === "dish" ? "Dish • " : ""}
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
