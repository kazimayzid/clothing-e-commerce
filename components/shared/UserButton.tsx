import { CircleUser } from "lucide-react";
import Link from "next/link";

export default function UserButton() {
  return (
    <Link
      href="/sign-in"
      aria-label="Sign in"
      className="group relative flex h-8 items-center justify-center gap-2 rounded-full border border-black/5 bg-white/80 px-2 shadow-xs backdrop-blur-xs transition-all duration-300 hover:bg-white hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <CircleUser className="h-4 w-4 shrink-0 text-neutral-600 transition-colors duration-200 group-hover:text-black" />

      <span className="max-w-0 text-neutral-500 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-16 group-hover:opacity-100">
        Sign in
      </span>
    </Link>
  );
}