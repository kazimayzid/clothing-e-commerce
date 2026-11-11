export default function LoadingScreen({
  fullScreen = true,
}: {
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex ${fullScreen ? "min-h-screen" : "min-h-[60vh]"} items-center justify-center overflow-hidden bg-[#F5F4F0] text-[#171717]`}
    >
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full border border-black/[0.04]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full border border-black/[0.04]" />

      <div className="relative flex w-full max-w-sm flex-col items-center px-6">
        <div className="animate-pulse text-3xl font-semibold tracking-[0.35em]">
          BRAND
        </div>

        <p className="mt-3 text-[9px] font-medium tracking-[0.3em] text-[#88847D]">
          CURATED FOR EVERYDAY LIVING
        </p>

        <div className="mt-16 w-full max-w-[190px]">
          <div className="mb-3 flex justify-between text-[9px] font-medium tracking-[0.16em] text-[#77736D]">
            <span>PREPARING YOUR EXPERIENCE</span>
            <span>01</span>
          </div>

          <div className="h-[2px] w-full overflow-hidden bg-[#D8D6D0]">
            <div className="route-loading-bar h-full w-1/3 bg-[#171717]" />
          </div>
        </div>

        <p className="mt-6 text-xs tracking-wide text-[#88847D]">
          A little moment, please...
        </p>

        <span className="fixed bottom-8 text-[9px] tracking-[0.25em] text-[#A09C94]">
          CRAFTED WITH INTENTION
        </span>
      </div>
    </div>
  );
}
