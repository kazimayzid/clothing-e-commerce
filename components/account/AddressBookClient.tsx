"use client";

import { useState } from "react";
import { Check, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import type { CustomerAddress } from "@/lib/mock-data/customer-account";
import { mockCustomerAddresses } from "@/lib/mock-data/customer-account";

export default function AddressBookClient() {
  const [addresses, setAddresses] = useState(mockCustomerAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [notice, setNotice] = useState("");

  function saveAddress(address: Omit<CustomerAddress, "id" | "isDefault">, id?: string) {
    if (id) {
      setAddresses((current) => current.map((item) => item.id === id ? { ...item, ...address } : item));
      setNotice("Address updated in this preview.");
    } else {
      setAddresses((current) => [...current, { ...address, id: `address-${Date.now()}`, isDefault: current.length === 0 }]);
      setNotice("Address added to this preview.");
    }
    setDialogOpen(false);
  }

  function removeAddress(id: string) {
    setAddresses((current) => {
      const remaining = current.filter((item) => item.id !== id);
      if (current.find((item) => item.id === id)?.isDefault && remaining.length) return remaining.map((item, index) => ({ ...item, isDefault: index === 0 }));
      return remaining;
    });
    setNotice("Address removed from this preview.");
  }

  function setDefault(id: string) {
    setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === id })));
    setNotice("Default address updated in this preview.");
  }

  return (
    <>
      <AccountPageHeader title="Address Book" description="Keep the places you love to receive your LuneCraft pieces." aside={<button type="button" onClick={() => { setEditingAddress(null); setDialogOpen(true); }} className="inline-flex min-h-10 items-center justify-center gap-2 bg-stone-900 px-4 text-[10px] font-medium text-white transition hover:bg-stone-700"><Plus className="size-3.5" />Add address</button>} />
      {notice && <p role="status" className="mb-4 border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">{notice}</p>}
      {addresses.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className={`border bg-white p-4 sm:p-5 ${address.isDefault ? "border-[#c9b27e]" : "border-stone-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center bg-[#f5f2ec] text-[#8e6b2f]"><MapPin className="size-4" /></span><div><p className="text-xs font-medium text-stone-900">{address.type}</p><p className="mt-0.5 text-[9px] text-stone-400">{address.isDefault ? "Default address" : "Saved address"}</p></div></div>
                {address.isDefault && <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#8e6b2f]"><Star className="size-3 fill-current" />DEFAULT</span>}
              </div>
              <div className="mt-5 text-[11px] leading-5 text-stone-600"><p className="font-medium text-stone-800">{address.name}</p><p>{address.line1}</p>{address.line2 && <p>{address.line2}</p>}<p>{address.city}, {address.postcode}</p><p className="mt-1 text-stone-500">{address.phone}</p></div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-3">
                <button type="button" onClick={() => { setEditingAddress(address); setDialogOpen(true); }} className="inline-flex min-h-8 items-center gap-1.5 text-[10px] text-stone-600 hover:text-stone-950"><Pencil className="size-3" />Edit</button>
                {!address.isDefault && <button type="button" onClick={() => setDefault(address.id)} className="inline-flex min-h-8 items-center gap-1.5 text-[10px] text-stone-600 hover:text-stone-950"><Check className="size-3" />Set as default</button>}
                <button type="button" onClick={() => removeAddress(address.id)} className="ml-auto inline-flex min-h-8 items-center gap-1.5 text-[10px] text-stone-500 hover:text-rose-700"><Trash2 className="size-3" />Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="flex min-h-56 flex-col items-center justify-center border border-dashed border-stone-300 bg-white px-6 text-center"><MapPin className="size-5 text-[#a88238]" /><h2 className="mt-4 font-serif text-xl text-stone-900">No saved addresses</h2><p className="mt-2 text-xs text-stone-500">Add an address to complete your account preview.</p><button type="button" onClick={() => { setEditingAddress(null); setDialogOpen(true); }} className="mt-4 min-h-10 bg-stone-900 px-4 text-xs text-white">Add your first address</button></section>
      )}
      <p className="mt-6 text-[10px] text-stone-400">Address edits are local to this design preview and are not saved to an account.</p>
      {dialogOpen && <AddressFormDialog initialAddress={editingAddress} onClose={() => setDialogOpen(false)} onSave={saveAddress} />}
    </>
  );
}

function AddressFormDialog({ initialAddress, onClose, onSave }: { initialAddress: CustomerAddress | null; onClose: () => void; onSave: (address: Omit<CustomerAddress, "id" | "isDefault">, id?: string) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      type: String(form.get("type") ?? "Home") as CustomerAddress["type"],
      line1: String(form.get("line1") ?? ""),
      line2: String(form.get("line2") ?? ""),
      city: String(form.get("city") ?? ""),
      postcode: String(form.get("postcode") ?? ""),
    }, initialAddress?.id);
  }
  const fieldClass = "mt-1 h-10 w-full border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none focus:border-stone-500";
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="address-dialog-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-lg">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4"><div><h2 id="address-dialog-title" className="font-serif text-xl text-stone-900">{initialAddress ? "Edit address" : "Add a new address"}</h2><p className="mt-1 text-[10px] text-stone-500">Sample address details for this account preview.</p></div><button type="button" onClick={onClose} aria-label="Close address dialog" className="flex size-9 items-center justify-center text-stone-500 hover:bg-stone-100"><X className="size-4" /></button></header>
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-[10px] text-stone-500">Full name<input required name="name" defaultValue={initialAddress?.name ?? ""} className={fieldClass} /></label>
          <label className="text-[10px] text-stone-500">Phone<input required name="phone" defaultValue={initialAddress?.phone ?? ""} className={fieldClass} /></label>
          <label className="text-[10px] text-stone-500">Address type<select name="type" defaultValue={initialAddress?.type ?? "Home"} className={fieldClass}><option>Home</option><option>Office</option></select></label>
          <label className="text-[10px] text-stone-500">Address line 1<input required name="line1" defaultValue={initialAddress?.line1 ?? ""} className={fieldClass} /></label>
          <label className="text-[10px] text-stone-500">Address line 2<input name="line2" defaultValue={initialAddress?.line2 ?? ""} className={fieldClass} /></label>
          <label className="text-[10px] text-stone-500">City<input required name="city" defaultValue={initialAddress?.city ?? ""} className={fieldClass} /></label>
          <label className="text-[10px] text-stone-500">Postcode<input required name="postcode" defaultValue={initialAddress?.postcode ?? ""} className={fieldClass} /></label>
          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="min-h-10 border border-stone-200 px-4 text-xs text-stone-600">Cancel</button><button type="submit" className="min-h-10 bg-stone-900 px-4 text-xs font-medium text-white">Save address</button></div>
        </form>
      </section>
    </div>
  );
}
