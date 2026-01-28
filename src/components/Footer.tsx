import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import quickbiteLogo from "@/assets/quickbite-logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-foreground text-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand & About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={quickbiteLogo} alt="QuickBite" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl">QuickBite</span>
            </div>
            <p className="text-sm text-card/70 mb-4">
              Delivering happiness to your doorstep. Fresh food, fast delivery, great prices.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-card/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-card/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-card/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-card/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-card/70">
              <li><Link to="/" className="hover:text-card hover:pl-1 transition-all">Home</Link></li>
              <li><Link to="/favorites" className="hover:text-card hover:pl-1 transition-all">Favorites</Link></li>
              <li><Link to="/orders" className="hover:text-card hover:pl-1 transition-all">My Orders</Link></li>
              <li><Link to="/profile" className="hover:text-card hover:pl-1 transition-all">My Profile</Link></li>
              <li><Link to="/partner" className="hover:text-card hover:pl-1 transition-all">Partner Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-card/70">
              <li><Link to="/terms" className="hover:text-card hover:pl-1 transition-all">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-card hover:pl-1 transition-all">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-card hover:pl-1 transition-all">Refund Policy</Link></li>
              <li><Link to="/help" className="hover:text-card hover:pl-1 transition-all">Help & Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-card/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>123 Food Street, Melvisharam, Tamil Nadu 632509</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span>support@quickbite.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-card/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-card/60">
            © {new Date().getFullYear()} QuickBite. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-card/60">
            <Link to="/terms" className="hover:text-card transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-card transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/help" className="hover:text-card transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;