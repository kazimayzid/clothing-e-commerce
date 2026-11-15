import type { CartItem } from "@/types/cart";

export type StoredCartEntry = Omit<CartItem, "variant" | "imageSrc"> &
  Partial<Pick<CartItem, "variant" | "imageSrc">>;
export type StoredWishlistEntry = {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  imageSrc?: string;
};
export type WishlistFeedback = {
  message: "Added to your wishlist" | "Removed from your wishlist";
  canViewWishlist: boolean;
};

const CART_KEY = "store-cart-items";
const WISHLIST_KEY = "store-wishlist-items";
const CHANGE_EVENT = "store-actions-changed";
const WISHLIST_FEEDBACK_EVENT = "store-wishlist-feedback";
const LEGACY_CART_IMAGE =
  "https://images.unsplash.com/photo-1625910513413-3fc215c76e2b?auto=format&fit=crop&w=800&q=80";

function read<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function publishChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getCartItems() {
  return read<StoredCartEntry>(CART_KEY).map((item) => ({
    ...item,
    variant: item.variant ?? "Standard",
    imageSrc: item.imageSrc || LEGACY_CART_IMAGE,
  }));
}

export function getWishlistItems() {
  return read<StoredWishlistEntry>(WISHLIST_KEY).map((item) => ({
    ...item,
    price: Number(item.price ?? 0),
    imageSrc: item.imageSrc || LEGACY_CART_IMAGE,
  }));
}

export function saveCartItem(item: StoredCartEntry) {
  const normalizedItem = {
    ...item,
    variant: item.variant ?? "Standard",
    imageSrc: item.imageSrc || LEGACY_CART_IMAGE,
  };
  const items = getCartItems();
  const existing = items.find((entry) => entry.id === item.id);
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(
      existing
        ? items.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                ...normalizedItem,
                quantity: entry.quantity + normalizedItem.quantity,
              }
            : entry,
          )
        : [...items, normalizedItem],
    ),
  );
  publishChange();
}

export function updateCartItemQuantity(id: string, delta: number) {
  const items = getCartItems()
    .map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + delta } : item,
    )
    .filter((item) => item.quantity > 0);

  localStorage.setItem(CART_KEY, JSON.stringify(items));
  publishChange();
}

export function removeCartItem(id: string) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(getCartItems().filter((item) => item.id !== id)),
  );
  publishChange();
}

export function toggleWishlistItem(item: StoredWishlistEntry) {
  const items = getWishlistItems();
  const exists = items.some(
    (entry) =>
      entry.id === item.id ||
      (Boolean(item.slug) && entry.slug === item.slug) ||
      entry.title === item.title,
  );
  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(
      exists
        ? items.filter(
            (entry) =>
              entry.id !== item.id &&
              (!item.slug || entry.slug !== item.slug) &&
              entry.title !== item.title,
          )
        : [...items, item],
    ),
  );
  publishChange();
  return !exists;
}

export function publishWishlistFeedback(added: boolean) {
  const detail: WishlistFeedback = {
    message: added
      ? "Added to your wishlist"
      : "Removed from your wishlist",
    canViewWishlist: added,
  };
  window.dispatchEvent(
    new CustomEvent<WishlistFeedback>(WISHLIST_FEEDBACK_EVENT, { detail }),
  );
}

export function subscribeToWishlistFeedback(
  listener: (feedback: WishlistFeedback) => void,
) {
  const handleFeedback = (event: Event) => {
    listener((event as CustomEvent<WishlistFeedback>).detail);
  };

  window.addEventListener(WISHLIST_FEEDBACK_EVENT, handleFeedback);
  return () =>
    window.removeEventListener(WISHLIST_FEEDBACK_EVENT, handleFeedback);
}

export function removeWishlistItem(id: string) {
  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(getWishlistItems().filter((entry) => entry.id !== id)),
  );
  publishChange();
}

export function saveWishlistItems(items: StoredWishlistEntry[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  publishChange();
}

export function subscribeToActionChanges(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
