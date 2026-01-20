import React from "react";
import { Search, MapPin } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-20 relative">
        <div className="max-w-2xl mx-auto text-center">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-4 animate-fade-in">
            Hungry? Order food
            <br />
            <span className="text-white/90">in a few clicks</span>
          </h1>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
            From your favorite restaurants to your doorstep
          </p>

          {/* Search Box */}
          <div className="bg-card rounded-2xl p-2 swiggy-shadow animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Location Input */}
              <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter delivery location"
                  className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>

              {/* Search Button */}
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                <Search className="w-5 h-5" />
                <span>Find Food</span>
              </button>
            </div>
          </div>

          {/* Popular Locations */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
            {["Koramangala", "Indiranagar", "HSR Layout", "Whitefield"].map((location) => (
              <button
                key={location}
                className="px-4 py-2 bg-white/10 text-primary-foreground rounded-full text-sm hover:bg-white/20 transition-colors"
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
