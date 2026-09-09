"use client";

import { useState } from "react";

import AddToBag from "./AddToBag";
import BuyNow from "./BuyNow";
import Quantity from "./Quantity";
import Wishlist from "./WishList";

interface ProductActionsProps {
  numericPrice: number;
}

export default function ProductActions({ numericPrice }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-2.5">
      <Quantity quantity={quantity} setQuantity={setQuantity} />

      <AddToBag numericPrice={numericPrice} quantity={quantity} />

      <BuyNow />

      <Wishlist />
    </div>
  );
}
