import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CartItemRow from "./CartItemRow";
import { CartItem } from "@/types/cart";

interface YourBagProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export default function YourBag({
  items,
  onRemove,
  onUpdateQuantity,
}: YourBagProps) {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <section className="w-full lg:w-7/12 xl:w-2/3 flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight">
          Your Bag
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="py-12 border-t border-neutral-200 text-center flex flex-col items-center">
          <p className="text-neutral-500 text-base mb-4">
            Your bag is currently empty.
          </p>
          <Link
            href="/products"
            className="bg-neutral-900 text-white px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 border-t border-neutral-200 pt-6">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-neutral-200 pt-6">
        <Link
          href="/products"
          className="text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:text-neutral-600 transition-colors flex items-center gap-2 w-fit underline underline-offset-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </section>
  );
}