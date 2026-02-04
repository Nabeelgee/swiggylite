import React from "react";
import { Phone } from "lucide-react";

interface FloatingCallButtonProps {
  phoneNumber: string;
}

const FloatingCallButton: React.FC<FloatingCallButtonProps> = ({ phoneNumber }) => {
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <button
      onClick={handleCall}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group animate-bounce hover:animate-none"
      aria-label="Call customer care"
    >
      <Phone className="w-5 h-5" />
      <span className="hidden md:inline font-medium">Customer Care</span>
    </button>
  );
};

export default FloatingCallButton;
