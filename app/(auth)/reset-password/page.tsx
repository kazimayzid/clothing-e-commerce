"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(search.get("error") ? "This password reset link is invalid or expired." : "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("This password reset link is invalid or expired.");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) throw new Error(result.error.message || "Unable to reset your password.");
      setMessage("Your password has been reset. Sign in with your new password.");
      window.setTimeout(() => router.replace("/sign-in"), 1200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="text-xs font-semibold tracking-[0.2em] text-neutral-700">LUNECRAFT</Link>
        <h1 className="mt-7 text-2xl font-semibold text-neutral-900">Choose a new password</h1>
        {token ? <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">New password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3" /></label>
          <label className="block text-sm">Confirm new password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3" /></label>
          <button disabled={loading} className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving..." : "Reset password"}</button>
        </form> : <p className="mt-3 text-sm text-neutral-600">Request a new password reset link to continue.</p>}
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {!token && <Link href="/forgot-password" className="mt-5 inline-block text-sm text-neutral-600 underline">Request a new reset link</Link>}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f8f8f6]" />}><ResetPasswordForm /></Suspense>;
}
