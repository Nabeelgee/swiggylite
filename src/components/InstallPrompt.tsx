import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (not immediately on page load)
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show iOS prompt after delay if on iOS
    if (isIOSDevice) {
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50",
        "bg-card border border-border rounded-2xl shadow-2xl p-4",
        "animate-in slide-in-from-bottom-5 duration-500"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-2xl font-bold text-primary-foreground">Q</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">Install QuickBite</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isIOS
              ? "Tap Share → Add to Home Screen for the best experience"
              : "Add to your home screen for quick access and offline ordering"}
          </p>

          {isIOS ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>
                Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong>
              </span>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
