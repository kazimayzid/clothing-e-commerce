"use client";

import { useState } from "react";

import AddToBag from "./AddToBag";
import BuyNow from "./BuyNow";
import Quantity from "./Quantity";
import Wishlist from "./WishList";

interface ProductActionsProps {
  id: string;
  slug: string;
  numericPrice: number;
  title: string;
  imageSrc: string;
  variant: string;
}

export default function ProductActions({
  id,
  slug,
  numericPrice,
  title,
  imageSrc,
  variant,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const cartItem = {
    id,
    slug,
    title,
    price: numericPrice,
    quantity,
    imageSrc,
    variant,
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Quantity quantity={quantity} setQuantity={setQuantity} />

      <AddToBag
        {...cartItem}
        numericPrice={numericPrice}
        quantity={quantity}
      />

      <BuyNow item={cartItem} />

      <Wishlist title={title} />
    </div>
  );
}
