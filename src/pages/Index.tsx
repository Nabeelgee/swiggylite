import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCarousel from "@/components/CategoryCarousel";
import RestaurantList from "@/components/RestaurantList";
import Footer from "@/components/Footer";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <CategoryCarousel />
        <RestaurantList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
