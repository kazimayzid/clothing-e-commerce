"use client";

import { useRouter } from "next/navigation";
import Button from "../shared/Button";
import { saveCartItem, type StoredCartEntry } from "@/contexts/actionStorage";

export default function BuyNow({ item }: { item: StoredCartEntry }) {
  const router = useRouter();

  const handleBuyNow = () => {
    saveCartItem(item);
    router.push("/cart");
  };

  return (
    <Button
      type="button"
      onClick={handleBuyNow}
      className="bg-amber-400 hover:bg-amber-300 text-black border border-amber-500 cursor-pointer"
    >
      Buy Now with 1-Click
    </Button>
  );
}
