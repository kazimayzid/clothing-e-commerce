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
  variantId?: string;
  sku?: string;
  selectedOptions: { color?: string; size?: string };
  stockQuantity: number;
  currency: string;
  available: boolean;
}

export default function ProductActions({
  id,
  slug,
  numericPrice,
  title,
  imageSrc,
  variant,
  variantId,
  sku,
  selectedOptions,
  stockQuantity,
  currency,
  available,
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
    productId: id,
    variantId,
    sku,
    selectedOptions,
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Quantity quantity={quantity} setQuantity={setQuantity} max={stockQuantity} available={available} />

      <AddToBag
        {...cartItem}
        numericPrice={numericPrice}
        quantity={quantity}
        variantId={variantId}
        sku={sku}
        selectedOptions={selectedOptions}
        stockQuantity={stockQuantity}
        currency={currency}
        available={available}
      />

      <BuyNow item={{ ...cartItem, price: numericPrice }} available={available && quantity <= stockQuantity} />

      <Wishlist item={{ id, slug, title, price: numericPrice, imageSrc }} />
    </div>
  );
}
