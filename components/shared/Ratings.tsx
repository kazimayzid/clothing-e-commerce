 interface RatingProps {
    rating: number,
    reviewCount: number
 }

export default function Ratings({rating, reviewCount}: RatingProps) {
    return (
        <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-amber-500 font-bold">★ ★ ★ ★ ★</span>

        <a
          href="#reviews-section"
          className="text-black font-medium hover:underline"
        >
          {(rating ?? 0).toFixed(1)}{" "}
          <span className="text-neutral-500 font-normal">
            ({reviewCount ?? 0} reviews)
          </span>
        </a>

        <span className="text-neutral-300">|</span>

        <span className="text-xs text-emerald-700 font-medium">
          98% Recommend
        </span>
      </div>
    )
}