import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, LogOut, Edit2, Save, X, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    default_address: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        default_address: profile.default_address || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(formData);
    setSaving(false);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </Link>

        <div className="bg-card rounded-2xl shadow-lg overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-6 sm:p-8 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {profile?.full_name || "User"}
                </h1>
                <p className="opacity-80">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Profile Details</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile?.full_name || "Not set"}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium text-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Phone</label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile?.phone || "Not set"}
                    </p>
                  )}
                </div>
              </div>

              {/* Default Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Default Address</label>
                  {isEditing ? (
                    <Input
                      value={formData.default_address}
                      onChange={(e) =>
                        setFormData({ ...formData, default_address: e.target.value })
                      }
                      placeholder="Enter your default delivery address"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile?.default_address || "Not set"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="border-t border-border p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/orders">
                <Button variant="outline" className="w-full justify-start">
                  📦 My Orders
                </Button>
              </Link>
              <Link to="/favorites">
                <Button variant="outline" className="w-full justify-start">
                  ❤️ Favorites
                </Button>
              </Link>
              <Link to="/checkout">
                <Button variant="outline" className="w-full justify-start">
                  🛒 My Cart
                </Button>
              </Link>
              <Link to="/help">
                <Button variant="outline" className="w-full justify-start">
                  💬 Help & Support
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Panel - Mobile */}
          <div className="border-t border-border p-6 sm:p-8 md:hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Administration</h3>
            <Link to="/admin">
              <Button variant="secondary" className="w-full justify-start">
                <Settings className="w-5 h-5 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border p-6 sm:p-8">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
