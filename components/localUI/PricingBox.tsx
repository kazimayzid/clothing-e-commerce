export default function PricingBox({
  numericOriginalPrice,
  numericPrice,
  currency = "USD",
}: {
  numericOriginalPrice: number;
  numericPrice: number;
  currency?: string;
}) {
  const formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency });
  return (
    <div className="bg-neutral-50 p-3 border border-neutral-200 mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-baseline gap-2.5">
        <span className="text-2xl md:text-3xl font-bold text-black">
          {formatter.format(numericPrice)}
        </span>

        {numericOriginalPrice !== undefined &&
          numericOriginalPrice > numericPrice && (
            <span className="text-neutral-400 line-through text-sm">
              {formatter.format(numericOriginalPrice)}
            </span>
          )}
      </div>

      {numericOriginalPrice !== undefined &&
        numericOriginalPrice > numericPrice && (
          <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 tracking-wide uppercase">
            SAVE {formatter.format(numericOriginalPrice - numericPrice)}
          </span>
        )}
    </div>
  );
}
