import React from "react";
import { WifiOff } from "lucide-react";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

const OfflineIndicator: React.FC = () => {
  const { isOnline, lastSync } = useOfflineStorage();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 animate-slide-down">
      <div className="mx-4 mt-2">
        <div className="bg-primary/90 backdrop-blur-xl text-primary-foreground px-4 py-2 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline</span>
          </div>
          {lastSync && (
            <span className="text-xs opacity-80">
              Last synced: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
