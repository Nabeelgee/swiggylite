export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  cuisines: string[];
  costForTwo: string;
  discount?: string;
  isVeg?: boolean;
  promoted?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isVeg: boolean;
  isBestseller?: boolean;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}
