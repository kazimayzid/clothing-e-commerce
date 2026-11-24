"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, RotateCcw, Truck } from "lucide-react";

export default function OrderPreviewActions({ orderId, canTrack }: { orderId: string; canTrack: boolean }) {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-2">
      <Link href="/account/orders" className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-stone-300 px-3 text-[10px] font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"><ArrowLeft className="size-3.5" />Back to orders</Link>
      {canTrack && <a href="#tracking" className="inline-flex min-h-10 w-full items-center justify-center gap-2 bg-stone-900 px-3 text-[10px] font-medium text-white transition hover:bg-stone-700"><Truck className="size-3.5" />Track shipment</a>}
      <button type="button" onClick={() => setMessage("Invoice download is a visual placeholder in this preview.")} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-stone-300 px-3 text-[10px] font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"><Download className="size-3.5" />Download invoice</button>
      <button type="button" onClick={() => setMessage(`Reorder for ${orderId} is a visual placeholder; your bag was not changed.`)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-stone-300 px-3 text-[10px] font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"><RotateCcw className="size-3.5" />Reorder</button>
      {message && <p role="status" className="border border-stone-200 bg-white p-3 text-[10px] leading-4 text-stone-500">{message}</p>}
    </div>
  );
}
