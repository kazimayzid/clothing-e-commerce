"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CircleUser, X } from "lucide-react";

import AuthSwitchLink from "@/components/shared/AuthSwitchLink";
import LoginPage from "@/components/shared/LoginPage";

type Props = {
  customerName?: string;
};

function getInitials(name: string) {
  return Array.from(name.trim().split(/\s+/))
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toLocaleUpperCase() ?? "")
    .join("");
}

export default function UserButtonClient({ customerName }: Props) {
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
    const nameWidth = `${Math.min(Math.max(customerName.length * 0.55 + 1, 4), 24)}rem`;

    return (
      <Link
        href="/account"
        aria-label={`Open account for ${customerName}`}
        title={customerName}
        style={{ "--customer-name-width": nameWidth } as CSSProperties}
        className="group relative flex h-8 items-center justify-center gap-2 rounded-full border border-black/5 bg-white/80 px-2 shadow-xs backdrop-blur-xs transition-all duration-300 hover:bg-white hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold tracking-wide text-white"
        >
          {initials}
        </span>

        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-neutral-700 opacity-0 transition-all duration-300 group-hover:max-w-[var(--customer-name-width)] group-hover:opacity-100">
          {customerName}
        </span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Sign in"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="group relative flex h-8 items-center justify-center gap-2 rounded-full border border-black/5 bg-white/80 px-2 shadow-xs backdrop-blur-xs transition-all duration-300 hover:bg-white hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <CircleUser className="h-4 w-4 shrink-0 text-neutral-600 transition-colors duration-200 group-hover:text-black" />

        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-neutral-500 opacity-0 transition-all duration-300 group-hover:max-w-16 group-hover:opacity-100">
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
    </>
  );
}
