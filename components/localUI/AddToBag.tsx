import Button from "../shared/Button";
import { saveCartItem } from "@/contexts/actionStorage";

interface AddToBagProps {
  numericPrice: number;
  quantity: number;
  title?: string;
}

export default function AddToBag({
  numericPrice,
  quantity,
  title = "Product",
}: AddToBagProps) {
  return (
    <Button
      type="button"
      onClick={() => saveCartItem({
        id: title.trim().toLowerCase().replace(/\s+/g, "-"),
        title,
        price: numericPrice,
        quantity,
      })}
      className="bg-[#0F172A] hover:bg-black text-white cursor-pointer"
    >
      Add to Bag — $
      {(numericPrice * quantity).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </Button>
  );
}
