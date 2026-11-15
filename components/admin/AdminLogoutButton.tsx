"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgressRef = useRef(false);

  async function handleLogout() {
    if (logoutInProgressRef.current) return;

    logoutInProgressRef.current = true;
    setIsLoggingOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error("Could not sign out. Please try again.");
        logoutInProgressRef.current = false;
        setIsLoggingOut(false);
        return;
      }

      router.replace("/admin/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
      logoutInProgressRef.current = false;
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-[12px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950 disabled:cursor-wait disabled:opacity-60"
    >
      {isLoggingOut ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
