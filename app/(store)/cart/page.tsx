"use client";

import { useState } from "react";
import { CartItem } from "@/types/cart";
import YourBag from "@/components/cart/YourBag";
import OrderSummary from "@/components/cart/OrderSummary";

const INITIAL_CART: CartItem[] = [
  {
    id: "cart-item-1",
    title: "The Structured Tote",
    variant: "Onyx Black",
    price: 450.0,
    quantity: 1,
    imageSrc:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    slug: "structured-leather-tote-bag",
  },
  {
    id: "cart-item-2",
    title: "Geometric Pendant",
    variant: "Sterling Silver",
    price: 125.0,
    quantity: 1,
    imageSrc:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    slug: "geometric-pendant",
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART);


  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  




  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left Side: Your Bag */}
      
   <YourBag items={items}  onRemove={handleRemove} onUpdateQuantity={handleUpdateQuantity}/>
      {/* Right Side: Order Summary & Checkout */}
    <OrderSummary items={items} />  
    </main>
  );
}