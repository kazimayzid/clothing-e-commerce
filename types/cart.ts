export interface CartItem {
  /** Cart-line identity, distinct per product variant. */
  id: string;
  productId?: string;
  variantId?: string;
  sku?: string;
  currency?: string;
  selectedOptions?: { color?: string; size?: string };
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
