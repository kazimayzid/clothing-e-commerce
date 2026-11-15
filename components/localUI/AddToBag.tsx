import Button from "../shared/Button";
import { saveCartItem } from "@/contexts/actionStorage";

interface AddToBagProps {
  id: string;
  slug: string;
  numericPrice: number;
  quantity: number;
  title: string;
  imageSrc: string;
  variant: string;
}

export default function AddToBag({
  id,
  slug,
  numericPrice,
  quantity,
  title,
  imageSrc,
  variant,
}: AddToBagProps) {
  return (
    <Button
      type="button"
      onClick={() => saveCartItem({
        id,
        slug,
        title,
        price: numericPrice,
        quantity,
        imageSrc,
        variant,
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
