export interface CartItem {
  id: string;
  title: string;
  variant: string;
  price: number;
  quantity: number;
  imageSrc: string;
  slug?: string;
}

export interface OrderSummaryProps {
  subtotal: number;
  onProceedToCheckout: (email: string) => void;
}