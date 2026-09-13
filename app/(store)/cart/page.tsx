"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import CartItemRow from "@/components/cart/CartItemRow";
import { CartItem } from "@/types/cart";

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
  const [email, setEmail] = useState("");

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

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Route to checkout or trigger your payment flow
    console.log("Proceeding to checkout with:", { email, items, subtotal });
  };

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left Side: Your Bag */}
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
            <p className="text-neutral-500 text-base mb-4">Your bag is currently empty.</p>
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
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
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

      {/* Right Side: Order Summary & Checkout */}
      <section className="w-full lg:w-5/12 xl:w-1/3 relative">
        <div className="bg-neutral-50/70 border border-neutral-200 rounded-lg p-6 md:p-8 shadow-sm sticky top-28">
          <h2 className="font-serif text-2xl text-neutral-900 mb-6">Order Summary</h2>

          <div className="flex flex-col gap-3 text-sm text-neutral-800 border-b border-neutral-200 pb-6 mb-6">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping</span>
              <span className="text-xs text-neutral-600 italic">Calculated at next step</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tax</span>
              <span className="text-xs text-neutral-600 italic">Calculated at next step</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline mb-6">
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-900">
              Total
            </span>
            <span className="font-serif text-2xl font-bold text-neutral-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                id="checkout-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="peer block w-full border-0 border-b border-neutral-300 bg-transparent py-2.5 px-0 text-sm text-neutral-900 focus:border-black focus:ring-0 placeholder-transparent transition-colors outline-none"
              />
              <label
                htmlFor="checkout-email"
                className="absolute left-0 -top-3.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-2.5 peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-3.5 peer-focus:text-neutral-900 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider cursor-text"
              >
                Email Address
              </label>
            </div>

            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full mt-3 bg-neutral-900 disabled:bg-neutral-300 text-white py-4 px-6 text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 active:scale-[0.99] transition-all flex justify-center items-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-5 text-neutral-500">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              Encrypted 256-Bit SSL Checkout
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}