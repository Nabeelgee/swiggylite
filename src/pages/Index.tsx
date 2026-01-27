import React, { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import CategoryCarousel from "@/components/CategoryCarousel";
import RestaurantList from "@/components/RestaurantList";
import Footer from "@/components/Footer";
import PullToRefresh from "@/components/PullToRefresh";

const Index: React.FC = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate and refetch restaurant data
    await queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={handleRefresh}>
        <main>
          <Hero />
          <CategoryCarousel />
          <RestaurantList />
        </main>
        <Footer />
      </PullToRefresh>
    </div>
  );
};

export default Index;
