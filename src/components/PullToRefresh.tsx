import React from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = "",
}) => {
  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
  });

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto h-full ${className}`}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center transition-opacity duration-200 pointer-events-none z-50"
        style={{
          top: 0,
          opacity: progress > 0.1 ? 1 : 0,
          transform: `translateY(${Math.min(pullDistance, 60)}px)`,
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-card shadow-lg border flex items-center justify-center transition-transform ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: isRefreshing ? "none" : `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw
            className={`w-5 h-5 text-primary ${
              progress >= 1 ? "text-swiggy-green" : ""
            }`}
          />
        </div>
      </div>

      {/* Content with pull translation */}
      <div
        style={{
          transform: `translateY(${pullDistance > 0 ? Math.min(pullDistance, 60) : 0}px)`,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
