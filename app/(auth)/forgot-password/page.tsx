"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
      if (result.error) throw new Error(result.error.message || "Unable to request a password reset.");
      setMessage("If this email belongs to an account, a password reset link has been sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="text-xs font-semibold tracking-[0.2em] text-neutral-700">LUNECRAFT</Link>
        <h1 className="mt-7 text-2xl font-semibold text-neutral-900">Reset your password</h1>
        <p className="mt-2 text-sm text-neutral-600">Enter your account email and we will send a secure reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3" /></label>
          <button disabled={loading} className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Sending..." : "Send reset link"}</button>
        </form>
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Link href="/sign-in" className="mt-5 inline-block text-sm text-neutral-600 underline">Back to sign in</Link>
      </section>
    </main>
  );
}
