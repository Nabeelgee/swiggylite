import React, { createContext, useContext, useState, ReactNode } from "react";

interface DeliveryLocationContextType {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}

const DeliveryLocationContext = createContext<DeliveryLocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState("");

  return (
    <DeliveryLocationContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </DeliveryLocationContext.Provider>
  );
};

export const useDeliveryLocation = () => {
  const context = useContext(DeliveryLocationContext);
  if (!context) {
    throw new Error("useDeliveryLocation must be used within a LocationProvider");
  }
  return context;
};
