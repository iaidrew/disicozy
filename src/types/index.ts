export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  available: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  customizations?: string;
}

export interface Order {
  id: string;
  tableId: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  customerPhone?: string;
  customerEmail?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface Table {
  id: string;
  tableNumber: string;
  isActive: boolean;
}
