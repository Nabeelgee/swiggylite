import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface Location {
  lat: number;
  lng: number;
}

interface ETANotificationOptions {
  orderId: string;
  partnerLocation: Location | null;
  deliveryLocation: Location | null;
  partnerName?: string;
  isEnabled?: boolean;
}

// Calculate distance in meters using Haversine formula
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Distance thresholds for notifications (in meters)
const NOTIFICATION_THRESHOLDS = {
  FAR: 2000,      // 2km - "Your order is on the way"
  NEARBY: 500,    // 500m - "Delivery partner is nearby"
  ARRIVING: 200,  // 200m - "Almost there!"
  VERY_CLOSE: 50, // 50m - "Delivery partner has arrived"
};

export const useETANotifications = ({
  orderId,
  partnerLocation,
  deliveryLocation,
  partnerName = "Delivery partner",
  isEnabled = true,
}: ETANotificationOptions) => {
  const lastNotifiedThreshold = useRef<string | null>(null);
  const hasPermission = useRef(false);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Browser doesn't support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      hasPermission.current = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      hasPermission.current = permission === "granted";
      return hasPermission.current;
    }

    return false;
  }, []);

  // Send notification
  const sendNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      // Always show in-app toast
      toast(title, {
        description: body,
        duration: 5000,
      });

      // Try browser notification if permitted
      if (hasPermission.current && "Notification" in window) {
        try {
          new Notification(title, {
            body,
            icon: icon || "/pwa-192x192.png",
            tag: `order-${orderId}`,
          });
        } catch (e) {
          console.log("Browser notification failed:", e);
        }
      }
    },
    [orderId]
  );

  // Check distance and send appropriate notification
  useEffect(() => {
    if (!isEnabled || !partnerLocation || !deliveryLocation) return;

    const distance = calculateDistance(partnerLocation, deliveryLocation);

    let currentThreshold: string | null = null;
    let notificationContent: { title: string; body: string } | null = null;

    if (distance <= NOTIFICATION_THRESHOLDS.VERY_CLOSE) {
      currentThreshold = "VERY_CLOSE";
      notificationContent = {
        title: "🎉 Delivery Partner Arrived!",
        body: `${partnerName} has arrived at your location. Please collect your order.`,
      };
    } else if (distance <= NOTIFICATION_THRESHOLDS.ARRIVING) {
      currentThreshold = "ARRIVING";
      notificationContent = {
        title: "🏃 Almost There!",
        body: `${partnerName} is less than 200 meters away. Get ready!`,
      };
    } else if (distance <= NOTIFICATION_THRESHOLDS.NEARBY) {
      currentThreshold = "NEARBY";
      notificationContent = {
        title: "📍 Delivery Partner Nearby",
        body: `${partnerName} is within 500 meters. Your order is arriving soon!`,
      };
    } else if (distance <= NOTIFICATION_THRESHOLDS.FAR) {
      currentThreshold = "FAR";
      notificationContent = {
        title: "🛵 Order On The Way",
        body: `${partnerName} is about ${Math.round(distance / 1000)}km away.`,
      };
    }

    // Only notify if we crossed a new threshold
    if (currentThreshold && currentThreshold !== lastNotifiedThreshold.current) {
      // Don't notify FAR threshold unless explicitly requested
      if (currentThreshold !== "FAR" || !lastNotifiedThreshold.current) {
        sendNotification(notificationContent!.title, notificationContent!.body);
      }
      lastNotifiedThreshold.current = currentThreshold;
    }
  }, [partnerLocation, deliveryLocation, partnerName, isEnabled, sendNotification]);

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    requestPermission,
    sendNotification,
    hasPermission: hasPermission.current,
  };
};
