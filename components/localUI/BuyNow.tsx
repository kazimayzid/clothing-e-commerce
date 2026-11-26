"use client";

import { useRouter } from "next/navigation";
import Button from "../shared/Button";
import { validateAndSaveProductVariant, type StoredCartEntry } from "@/contexts/actionStorage";
import { useState } from "react";
import { toast } from "sonner";

export default function BuyNow({ item, available }: { item: StoredCartEntry; available: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleBuyNow = async () => {
    if (!available || busy) return;
    setBusy(true);
    try {
      await validateAndSaveProductVariant(item);
      router.push("/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify this product option.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void handleBuyNow()}
      disabled={!available || busy}
      className="bg-amber-400 text-black border border-amber-500 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!available ? "Unavailable" : busy ? "Checking stock…" : "Buy Now with 1-Click"}
    </Button>
  );
}
