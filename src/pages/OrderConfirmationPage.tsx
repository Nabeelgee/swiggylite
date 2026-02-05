import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Package, Clock, MapPin, ArrowRight, Upload, Camera, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId || "");
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Check if order has GPay payment
  const isGPayOrder = order?.special_instructions?.includes("Google Pay");

  // Load existing screenshot URL
  useEffect(() => {
    if (order && (order as any).payment_screenshot_url) {
      setScreenshotUrl((order as any).payment_screenshot_url);
    }
  }, [order]);

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !orderId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${orderId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Update order with screenshot URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({ payment_screenshot_url: publicUrl } as any)
        .eq('id', orderId);

      if (updateError) throw updateError;

      setScreenshotUrl(publicUrl);
      toast.success("Payment screenshot uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Trigger confetti animation on mount
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff6b35", "#00b37e", "#ffb800"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff6b35", "#00b37e", "#ffb800"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-swiggy-green-light rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle className="w-12 h-12 text-swiggy-green" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Thank You for Ordering! 🎉
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your order has been placed successfully
          </p>

          {order && (
            <div className="bg-card rounded-2xl p-6 swiggy-shadow text-left mb-8">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{order.restaurant_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">30-40 minutes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-foreground">₹{order.total_amount}</span>
              </div>
            </div>
          )}

          {/* Payment Screenshot Upload Section for GPay orders */}
          {order && isGPayOrder && (
            <div className="bg-card rounded-2xl p-6 swiggy-shadow text-left mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Payment Confirmation</p>
                  <p className="text-sm text-muted-foreground">Upload your GPay payment screenshot</p>
                </div>
              </div>

              {screenshotUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img 
                      src={screenshotUrl} 
                      alt="Payment Screenshot" 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-swiggy-green text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </div>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                      <Upload className="w-4 h-4" />
                      Replace Screenshot
                    </div>
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">Click to upload screenshot</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </label>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate(`/order/${orderId}`)}
              className="flex-1 bg-primary hover:bg-primary/90 gap-2"
            >
              Track Your Order
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Continue Ordering
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmationPage;
