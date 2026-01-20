import React from "react";
import { categories } from "@/data/restaurants";

const CategoryCarousel: React.FC = () => {
  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
          What's on your mind?
        </h2>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px] group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-swiggy-orange-light flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                {category.image}
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;
