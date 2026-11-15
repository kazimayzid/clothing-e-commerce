"use client";

import { Toaster } from "sonner";

export default function SonnerToaster() {
  return (
    <Toaster
      position="top-right"
      offset={80}
      theme="light"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans",
          actionButton: "!bg-neutral-900 !text-white",
        },
      }}
    />
  );
}
