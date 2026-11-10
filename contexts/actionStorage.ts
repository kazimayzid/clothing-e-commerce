export type StoredCartEntry = { id: string; title: string; quantity: number; price: number };
export type StoredWishlistEntry = { id: string; title: string };

const CART_KEY = "store-cart-items";
const WISHLIST_KEY = "store-wishlist-items";
const CHANGE_EVENT = "store-actions-changed";

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
  return read<StoredCartEntry>(CART_KEY);
}

export function getWishlistItems() {
  return read<StoredWishlistEntry>(WISHLIST_KEY);
}

export function saveCartItem(item: StoredCartEntry) {
  const items = getCartItems();
  const existing = items.find((entry) => entry.id === item.id);
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(existing
      ? items.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
      : [...items, item]),
  );
  publishChange();
}

export function toggleWishlistItem(item: StoredWishlistEntry) {
  const items = getWishlistItems();
  const exists = items.some((entry) => entry.id === item.id);
  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(exists ? items.filter((entry) => entry.id !== item.id) : [...items, item]),
  );
  publishChange();
  return !exists;
}

export function subscribeToActionChanges(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
