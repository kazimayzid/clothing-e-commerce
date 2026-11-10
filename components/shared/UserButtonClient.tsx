"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CircleUser, X } from "lucide-react";

import AuthSwitchLink from "@/components/shared/AuthSwitchLink";
import LoginPage from "@/components/shared/LoginPage";

type Props = {
  customerName?: string;
  variant?: "desktop" | "mobile";
};

function getInitials(name: string) {
  return Array.from(name.trim().split(/\s+/))
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toLocaleUpperCase() ?? "")
    .join("");
}

export default function UserButtonClient({
  customerName,
  variant = "desktop",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (customerName) {
    const initials = getInitials(customerName) || "U";
    const isMobile = variant === "mobile";

    return (
      <div className={isMobile ? "shrink-0" : "relative h-8 w-8 shrink-0"}>
        <Link
          href="/account"
          aria-label={`Open account for ${customerName}`}
          title={customerName}
          className={
            isMobile
              ? "flex h-9 items-center gap-2 rounded-full px-1 text-sm font-medium text-neutral-700"
              : "group absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-full border border-black/5 bg-white/90 shadow-xs backdrop-blur-xs transition-all duration-200 hover:bg-white hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
          }
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold tracking-wide text-white"
          >
            {initials}
          </span>

          <span
            className={
              isMobile
                ? "whitespace-nowrap"
                : "pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 max-w-[min(24rem,80vw)] translate-y-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
            }
          >
            {customerName}
          </span>
        </Link>
      </div>
    );
  }

  const isMobile = variant === "mobile";

  return (
    <div className={isMobile ? "shrink-0" : "relative h-8 w-8 shrink-0"}>
      <button
        type="button"
        aria-label="Sign in"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={
          isMobile
            ? "flex h-9 items-center gap-2 rounded-full px-1 text-sm font-medium text-neutral-700"
            : "group absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-full border border-black/5 bg-white/90 shadow-xs backdrop-blur-xs transition-all duration-200 hover:bg-white hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
        }
      >
        <CircleUser
          className={`h-4 w-4 shrink-0 text-neutral-600 ${isMobile ? "" : "transition-colors duration-200 group-hover:text-black"}`}
        />

        <span
          className={
            isMobile
              ? "whitespace-nowrap"
              : "pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 translate-y-1 whitespace-nowrap rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-500 opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          }
        >
          Sign in
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Sign in"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setIsOpen(false);
          }
        }}
        className="m-auto max-h-[90dvh] w-[min(92vw,28rem)] overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/50"
      >
        <div className="relative">
          <button
            type="button"
            aria-label="Close sign in"
            autoFocus
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <LoginPage
            variant="modal"
            audience="customer"
            callbackURL="/account"
            onSuccess={() => setIsOpen(false)}
          >
            <AuthSwitchLink
              message="Don't have an account?"
              linkText="Create an account"
              href="/sign-up"
            />
          </LoginPage>
        </div>
      </dialog>
    </div>
  );
}
