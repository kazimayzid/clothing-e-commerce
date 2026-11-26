"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/types/cart";
import YourBag from "@/components/cart/YourBag";
import OrderSummary from "@/components/cart/OrderSummary";
import {
  getValidatedProductVariantCartEntry,
  getCartItems,
  replaceCartItem,
  removeCartItem,
  subscribeToActionChanges,
  updateCartItemQuantity,
} from "@/contexts/actionStorage";
import { toast } from "sonner";

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

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const nextQuantity = item.quantity + delta;
    if (delta > 0 && item.variantId && item.productId) {
      try {
        const refreshed = await getValidatedProductVariantCartEntry(item, nextQuantity);
        replaceCartItem(refreshed);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not verify available stock.");
      }
      return;
    }
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
