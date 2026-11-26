"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "../shared/Button";
import { validateAndSaveProductVariant } from "@/contexts/actionStorage";

interface AddToBagProps {
  id: string;
  slug: string;
  numericPrice: number;
  quantity: number;
  title: string;
  imageSrc: string;
  variant: string;
  variantId?: string;
  sku?: string;
  selectedOptions?: { color?: string; size?: string };
  stockQuantity: number;
  currency: string;
  available: boolean;
}

export default function AddToBag(props: AddToBagProps) {
  const [busy, setBusy] = useState(false);
  const formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: props.currency });
  const addToBag = async () => {
    if (busy || !props.available) return;
    setBusy(true);
    try {
      await validateAndSaveProductVariant({
        id: props.id,
        productId: props.id,
        variantId: props.variantId,
        sku: props.sku,
        selectedOptions: props.selectedOptions,
        slug: props.slug,
        title: props.title,
        price: props.numericPrice,
        quantity: props.quantity,
        imageSrc: props.imageSrc,
        variant: props.variant,
      });
      toast.success("Added to your bag");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this option to your bag.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" onClick={() => void addToBag()} disabled={!props.available || props.quantity > props.stockQuantity || busy} className="bg-[#0F172A] text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
      {!props.available ? "Unavailable" : busy ? "Checking stock…" : `Add to Bag — ${formatter.format(props.numericPrice * props.quantity)}`}
    </Button>
  );
}
