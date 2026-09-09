import Button from "../shared/Button";

interface AddToBagProps {
  numericPrice: number;
  quantity: number;
}

export default function AddToBag({
  numericPrice,
  quantity,
}: AddToBagProps) {
  return (
    <Button
      type="button"
      className="bg-[#0F172A] hover:bg-black text-white"
    >
      Add to Bag — $
      {(numericPrice * quantity).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </Button>
  );
}