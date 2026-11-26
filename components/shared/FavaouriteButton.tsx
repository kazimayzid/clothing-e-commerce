"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  getWishlistItems,
  publishWishlistFeedback,
  subscribeToWishlistFeedback,
  removeWishlistItem,
  saveWishlistItems,
  validateAndSaveProductVariant,
  subscribeToActionChanges,
  type StoredWishlistEntry,
} from "@/contexts/actionStorage";
import type { ProductCardDTO } from "@/types/product";

function normalizeProductTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function FavoriteButton() {
  const router = useRouter();
  const [items, setItems] = useState<StoredWishlistEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isHydratingLegacyItems, setIsHydratingLegacyItems] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const legacyHydrationAttemptedRef = useRef(false);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      closeTimerRef.current = null;
      triggerRef.current?.focus();
    }, 300);
  }, []);

  const openDrawer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsRendered(true);
    window.requestAnimationFrame(() => setIsOpen(true));
  }, []);

  useEffect(() => {
    const syncWishlist = () => setItems(getWishlistItems());

    syncWishlist();
    return subscribeToActionChanges(syncWishlist);
  }, []);

  useEffect(
    () =>
      subscribeToWishlistFeedback((feedback) => {
        toast(feedback.message, {
          duration: 3200,
          ...(feedback.canViewWishlist
            ? {
                action: {
                  label: "View Wishlist",
                  onClick: openDrawer,
                },
              }
            : {}),
        });
      }),
    [openDrawer],
  );

  useEffect(() => {
    const hasLegacyItems = items.some(
      (item) => !item.slug || (item.price ?? 0) <= 0,
    );

    if (!isOpen || !hasLegacyItems || legacyHydrationAttemptedRef.current) {
      return;
    }

    legacyHydrationAttemptedRef.current = true;
    setIsHydratingLegacyItems(true);

    void fetch("/api/v1/products")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load wishlist products");
        return response.json() as Promise<ProductCardDTO[]>;
      })
      .then((products) => {
        const currentItems = getWishlistItems();
        const enrichedItems = currentItems.map((item) => {
          if (item.slug && (item.price ?? 0) > 0) return item;

          const legacyId = normalizeProductTitle(item.title);
          const product = products.find(
            (candidate) =>
              candidate.id === item.id ||
              normalizeProductTitle(candidate.title) === legacyId,
          );

          if (!product) return item;

          return {
            ...item,
            id: product.id,
            title: product.title,
            slug: product.slug,
            price: Number(product.price),
            imageSrc: product.imageSrc,
          };
        });

        saveWishlistItems(enrichedItems);
      })
      .catch(() => undefined)
      .finally(() => setIsHydratingLegacyItems(false));
  }, [isOpen, items]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
    };
  }, [closeDrawer, isOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  async function addItemToBag(item: StoredWishlistEntry): Promise<boolean> {
    try {
      await validateAndSaveProductVariant({
        id: item.id,
        productId: item.id,
        title: item.title,
        slug: item.slug,
        price: item.price ?? 0,
        quantity: 1,
        imageSrc: item.imageSrc,
        variant: "",
      });
      removeWishlistItem(item.id);
      toast.success("Added to your bag");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No available variant could be added.");
      return false;
    }
  }

  function handleRemoveWishlistItem(id: string) {
    removeWishlistItem(id);
    publishWishlistFeedback(false);
  }

  function moveItemToBag(item: StoredWishlistEntry) {
    void addItemToBag(item).then((added) => {
      if (added) {
        closeDrawer();
        router.push("/cart");
      }
    });
  }

  function moveAllToBag() {
    const movableItems = items.filter((item) => (item.price ?? 0) > 0);
    for (const item of movableItems) {
      addItemToBag(item);
    }
    closeDrawer();
    router.push("/cart");
  }

  const panel = isRendered ? (
    <div className="fixed inset-0 z-[1000]">
      <button
        type="button"
        aria-label="Close wishlist"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeDrawer}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`absolute inset-x-0 bottom-0 flex h-[80dvh] max-h-[85dvh] flex-col rounded-t-3xl bg-white text-neutral-900 shadow-2xl transition-transform duration-300 ease-out md:inset-y-0 md:left-auto md:right-0 md:h-dvh md:max-h-dvh md:w-[420px] md:rounded-none ${
          isOpen
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-neutral-300 md:hidden" />

        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-5 md:px-6">
          <div>
            <h2
              id="wishlist-title"
              className="font-serif text-2xl tracking-tight"
            >
              Wishlist
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {items.length} {items.length === 1 ? "saved item" : "saved items"}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close wishlist"
            className="rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
          {items.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
              <Heart className="size-8 text-neutral-300" strokeWidth={1.3} />
              <p className="mt-4 font-serif text-xl">Your wishlist is empty</p>
              <p className="mt-1 max-w-56 text-sm text-neutral-500">
                Save the pieces you love and find them here later.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-5 inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase underline underline-offset-4"
              >
                Continue shopping <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5 first:pt-1">
                  <Image
                    src={item.imageSrc || "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80"}
                    alt={item.title}
                    width={84}
                    height={108}
                    className="h-[108px] w-[84px] shrink-0 rounded-sm bg-neutral-100 object-cover"
                  />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-medium leading-snug">
                          {item.title}
                        </h3>
                        {(item.price ?? 0) > 0 ? (
                          <p className="mt-1 text-sm text-neutral-600">
                            ${item.price?.toFixed(2)}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-neutral-500">
                            Price unavailable
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveWishlistItem(item.id)}
                        aria-label={`Remove ${item.title} from wishlist`}
                        className="shrink-0 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center gap-3 pt-3">
                      {item.slug ? (
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="text-[10px] font-semibold tracking-wider uppercase underline underline-offset-4"
                        >
                          View product
                        </Link>
                      ) : (
                        <span className="text-[10px] tracking-wide text-neutral-400">
                          Product link unavailable
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={(item.price ?? 0) <= 0}
                        onClick={() => moveItemToBag(item)}
                        className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase disabled:cursor-not-allowed disabled:text-neutral-400"
                      >
                        <ShoppingBag className="size-3.5" /> Move to bag
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-neutral-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
            <button
              type="button"
              disabled={
                isHydratingLegacyItems ||
                !items.some((item) => (item.price ?? 0) > 0)
              }
              onClick={moveAllToBag}
              className="flex w-full items-center justify-center gap-2 bg-neutral-900 px-5 py-3.5 text-xs font-semibold tracking-widest text-white uppercase transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              <ShoppingBag className="size-4" />
              {isHydratingLegacyItems ? "Loading saved items..." : "Move all to bag"}
            </button>
          </footer>
        )}
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Open wishlist${items.length ? `, ${items.length} saved items` : ""}`}
        aria-expanded={isOpen}
        onClick={openDrawer}
        className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/80 shadow-xs transition-all duration-200 hover:scale-110 hover:bg-white active:scale-90 focus:outline-none"
      >
        <Heart className="h-4 w-4 fill-transparent stroke-neutral-600 transition-all duration-200 group-hover:stroke-black" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
