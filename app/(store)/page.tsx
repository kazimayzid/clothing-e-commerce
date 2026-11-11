import { Suspense } from "react";
import HeroBanner, { HeroBannerFallback } from "@/components/layout/HeroBanner";
import MenSection from "@/components/layout/MenSection";

export default function Home() {
  return (
    <div>
      <Suspense fallback={<HeroBannerFallback />}>
        <HeroBanner />
      </Suspense>
      <MenSection />
    </div>
  );
}
