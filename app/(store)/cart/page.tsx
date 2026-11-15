"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/types/cart";
import YourBag from "@/components/cart/YourBag";
import OrderSummary from "@/components/cart/OrderSummary";
import {
  getCartItems,
  removeCartItem,
  subscribeToActionChanges,
  updateCartItemQuantity,
} from "@/contexts/actionStorage";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncCart = () => {
      setItems(getCartItems());
      setIsHydrated(true);
    };

    syncCart();
    return subscribeToActionChanges(syncCart);
  }, []);

  const handleUpdateQuantity = (id: string, delta: number) => {
    updateCartItemQuantity(id, delta);
  };

  const handleRemove = (id: string) => {
    removeCartItem(id);
  };

  if (!isHydrated) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4 py-12 text-sm text-neutral-500">
        Loading your bag...
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-8 px-4 py-8 md:px-8 md:py-16 lg:flex-row lg:gap-12">
      <YourBag
        items={items}
        onRemove={handleRemove}
        onUpdateQuantity={handleUpdateQuantity}
      />
      <OrderSummary items={items} />
    </main>
  );
}
