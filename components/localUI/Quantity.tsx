"use client";

interface QuantityProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export default function Quantity({
  quantity,
  setQuantity,
}: QuantityProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase font-semibold text-black tracking-wider">
        Qty:
      </span>

      <div className="flex items-center border border-neutral-300 bg-white">
        <button
          type="button"
          onClick={() =>
            setQuantity((currentQuantity) =>
              Math.max(1, currentQuantity - 1)
            )
          }
          className="px-3 py-1 text-neutral-600 hover:text-black font-bold"
        >
          −
        </button>

        <span className="px-3 text-xs font-bold">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() =>
            setQuantity((currentQuantity) => currentQuantity + 1)
          }
          className="px-3 py-1 text-neutral-600 hover:text-black font-bold"
        >
          +
        </button>
      </div>

      <span className="text-[11px] text-emerald-700 font-medium">
        In Stock &amp; Ready to Ship
      </span>
    </div>
  );
}