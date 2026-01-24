import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bug, Wifi, WifiOff, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useAdmin";
import type { LiveTracking, LiveDeliveryPartner } from "@/hooks/useLiveOrderTracking";

interface TrackingDebugPanelProps {
  tracking: LiveTracking | null;
  partner: LiveDeliveryPartner | null;
  partnerLocation: { lat: number; lng: number } | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  eta?: { distance: string; duration: string } | null;
}

const TrackingDebugPanel: React.FC<TrackingDebugPanelProps> = ({
  tracking,
  partner,
  partnerLocation,
  isConnected,
  lastUpdate,
  eta,
}) => {
  const { data: isAdmin } = useIsAdmin();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show for admins
  if (!isAdmin) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bug className="w-4 h-4 text-primary" />
          <span>Tracking Debug Panel</span>
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
            Admin Only
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs ${isConnected ? "text-green-600" : "text-yellow-600"}`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? "Connected" : "Disconnected"}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-4 border-t border-border animate-fade-in">
          {/* Connection Status */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground mb-1">Realtime Status</p>
              <p className={`font-mono font-medium ${isConnected ? "text-green-600" : "text-yellow-600"}`}>
                {isConnected ? "SUBSCRIBED" : "CONNECTING..."}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground mb-1">Last Update</p>
              <p className="font-mono font-medium text-foreground">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : "N/A"}
              </p>
            </div>
          </div>

          {/* Tracking Payload */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              order_tracking Payload
            </p>
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
              {tracking ? JSON.stringify(tracking, null, 2) : "null (no tracking data)"}
            </pre>
          </div>

          {/* Partner Payload */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              🛵 delivery_partners Payload
            </p>
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
              {partner ? JSON.stringify(partner, null, 2) : "null (no partner assigned)"}
            </pre>
          </div>

          {/* Computed Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Computed Partner Location</p>
              <pre className="bg-muted rounded-lg p-2 text-xs font-mono">
                {partnerLocation 
                  ? `lat: ${partnerLocation.lat.toFixed(6)}\nlng: ${partnerLocation.lng.toFixed(6)}`
                  : "null"
                }
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ETA (OSRM)
              </p>
              <pre className="bg-muted rounded-lg p-2 text-xs font-mono">
                {eta 
                  ? `distance: ${eta.distance}\nduration: ${eta.duration}`
                  : "null (no route)"
                }
              </pre>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                console.log("=== TRACKING DEBUG ===");
                console.log("tracking:", tracking);
                console.log("partner:", partner);
                console.log("partnerLocation:", partnerLocation);
                console.log("isConnected:", isConnected);
                console.log("lastUpdate:", lastUpdate);
                console.log("eta:", eta);
              }}
            >
              Log to Console
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify({ tracking, partner, partnerLocation, eta }, null, 2));
              }}
            >
              Copy JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingDebugPanel;
