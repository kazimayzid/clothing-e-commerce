"use client";

import { useRouter } from "next/navigation";
import Button from "../shared/Button";

export default function BuyNow() {
  const router = useRouter();

  const handleBuyNow = () => {
    // আগে cart-এ product add করার logic
    // তারপর cart page-এ যাও
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