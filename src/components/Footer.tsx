import React from "react";
import { Link } from "react-router-dom";
const Footer: React.FC = () => {
  return <footer className="bg-foreground text-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h4 className="font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-card/70">
              <li><Link to="/about" className="hover:text-card transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-card transition-colors">Careers</Link></li>
              <li><Link to="/team" className="hover:text-card transition-colors">Team</Link></li>
              <li><Link to="/blog" className="hover:text-card transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-card/70">
              <li><Link to="/help" className="hover:text-card transition-colors">Help & Support</Link></li>
              <li><Link to="/partner" className="hover:text-card transition-colors">Partner with us</Link></li>
              <li><Link to="/ride" className="hover:text-card transition-colors">Ride with us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-card/70">
              <li><Link to="/terms" className="hover:text-card transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-card transition-colors">Refund & Cancellation</Link></li>
              <li><Link to="/privacy" className="hover:text-card transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* App Links */}
          
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-card/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">Q</span>
            </div>
            <span className="font-bold">QuickBite</span>
          </div>
          <p className="text-sm text-card/60">
            © 2024 QuickBite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;