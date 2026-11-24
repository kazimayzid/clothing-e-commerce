"use client";

import { useState } from "react";
import { BadgeCheck, Camera, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { customerAccountProfile, formatAccountDate } from "@/lib/mock-data/customer-account";

export default function ProfileSettingsClient() {
  const [name, setName] = useState(customerAccountProfile.name);
  const [email, setEmail] = useState(customerAccountProfile.email);
  const [phone, setPhone] = useState(customerAccountProfile.phone);
  const [notice, setNotice] = useState("");

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Profile changes are shown locally in this preview; nothing was saved to an account.");
  }

  const fieldClass = "mt-1.5 h-11 w-full border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition focus:border-stone-500";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <>
      <AccountPageHeader title="Profile Settings" description="Your personal details and account preferences." />
      {notice && <p role="status" className="mb-5 border border-stone-200 bg-white px-4 py-3 text-xs leading-5 text-stone-600">{notice}</p>}
      <form onSubmit={saveProfile} className="space-y-5">
        <section className="border border-stone-200 bg-white p-4 sm:p-6">
          <div className="border-b border-stone-100 pb-4"><p className="text-[9px] tracking-[0.17em] text-[#9b7a3b]">PERSONAL INFORMATION</p><h2 className="mt-1 font-serif text-lg text-stone-900">Your details</h2></div>
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#eee9df] font-serif text-lg text-stone-800">{initials}</span>
            <div><p className="text-xs font-medium text-stone-800">Profile image</p><p className="mt-1 text-[10px] text-stone-400">A profile photo can be added in a future account experience.</p><button type="button" onClick={() => setNotice("Profile image upload is a visual placeholder.")} className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-[10px] text-stone-600 underline decoration-stone-300 underline-offset-4"><Camera className="size-3" />Change photo</button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] text-stone-500">Full name<input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} autoComplete="name" /></label>
            <label className="text-[10px] text-stone-500">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} autoComplete="email" /><span className="mt-2 inline-flex items-center gap-1 text-[9px] text-emerald-700"><BadgeCheck className="size-3" />Email verified in sample data</span></label>
            <label className="text-[10px] text-stone-500 sm:col-span-2">Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} autoComplete="tel" /></label>
          </div>
          <div className="mt-5 flex justify-end border-t border-stone-100 pt-4"><button type="submit" className="min-h-10 bg-stone-900 px-5 text-xs font-medium text-white transition hover:bg-stone-700">Save changes</button></div>
        </section>
      </form>

      <section className="mt-5 border border-stone-200 bg-white p-4 sm:p-6">
        <div className="border-b border-stone-100 pb-4"><p className="text-[9px] tracking-[0.17em] text-[#9b7a3b]">ACCOUNT INFORMATION</p><h2 className="mt-1 font-serif text-lg text-stone-900">Account details</h2></div>
        <div className="grid gap-4 pt-4 sm:grid-cols-2"><div><p className="text-[9px] uppercase tracking-[0.12em] text-stone-400">Member since</p><p className="mt-1 text-xs text-stone-700">{formatAccountDate(customerAccountProfile.createdAt)}</p></div><div><p className="text-[9px] uppercase tracking-[0.12em] text-stone-400">Email status</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs text-emerald-700"><ShieldCheck className="size-3.5" />Verified</p></div></div>
      </section>

      <section className="mt-5 border border-stone-200 bg-white p-4 sm:p-6">
        <div className="border-b border-stone-100 pb-4"><p className="text-[9px] tracking-[0.17em] text-[#9b7a3b]">SECURITY</p><h2 className="mt-1 font-serif text-lg text-stone-900">Sign-in &amp; security</h2></div>
        <div className="divide-y divide-stone-100">
          <div className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 size-4 text-stone-400" /><div><p className="text-xs font-medium text-stone-800">Password</p><p className="mt-1 text-[10px] text-stone-400">Password controls are not active in this design preview.</p></div></div><button type="button" onClick={() => setNotice("Password updates are not connected in this preview.")} className="min-h-9 border border-stone-200 px-3 text-[10px] text-stone-600 hover:border-stone-400">Change password</button></div>
          <div className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><LogOut className="mt-0.5 size-4 text-stone-400" /><div><p className="text-xs font-medium text-stone-800">Sign out</p><p className="mt-1 text-[10px] text-stone-400">Sign-out is not connected in this design preview.</p></div></div><button type="button" onClick={() => setNotice("Sign-out is not connected in this preview.")} className="min-h-9 border border-stone-200 px-3 text-[10px] text-stone-600 hover:border-stone-400">Sign out</button></div>
        </div>
      </section>
      <p className="mt-5 text-[10px] text-stone-400">Profile edits and security actions are local visual placeholders only.</p>
    </>
  );
}
