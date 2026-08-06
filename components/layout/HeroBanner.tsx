import { getBannerData } from "@/services/banner.service";

export default async function HeroBanner() {
  const bannerData = await getBannerData();
  const video = bannerData?.videos?.[5];
  const videoUrl = video?.video_files?.[0]?.link;

  return (
    <div className="relative w-full h-[70vh] min-h-[420px] max-h-[750px] sm:h-[80vh] overflow-hidden bg-black">
      {/* Background Video */}
      {videoUrl && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-brightness-90" />

      {/* Content Container */}
      <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex max-w-2xl flex-col items-center text-center text-white">
          {/* Subtitle / Category Badge */}
          <span className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-neutral-200">
            Summer 2026
          </span>

          {/* Heading with Responsive Scaling */}
          <h1 className="mt-3 text-3xl font-bold tracking-tight uppercase sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            New Collection
          </h1>

          {/* Body Description */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base font-medium tracking-wide text-neutral-200 max-w-md">
            Discover our latest luxury styles, crafted for contemporary elegance.
          </p>

          {/* Responsive Action Button with Mouse Pointer */}
          <button className="mt-6 sm:mt-8 px-8 py-3.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-neutral-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}