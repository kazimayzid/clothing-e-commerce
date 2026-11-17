"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Invitation = { name: string; email: string; roles: { name: string }[]; expiresAt: string };

export default function AcceptAdminInvitationPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const session = authClient.useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/admin/invitations/verify?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Invitation is unavailable.");
        setInvitation(data.invitation);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Invitation is unavailable."));
  }, [token]);

  async function handleAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = invitation?.email ?? String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setLoading(true);
    try {
      if (mode === "signup") {
        const name = String(form.get("name") ?? invitation?.name ?? "");
        const result = await authClient.signUp.email({ name, email, password, callbackURL: window.location.href });
        if (result.error) throw new Error(result.error.message || "Unable to create your account.");
        setMessage("Account created. Check your email and verify it, then return to this invitation link.");
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message || "Unable to sign in.");
        setMessage("Signed in. Continue below to accept your invitation.");
      }
      await session.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  async function accept() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to accept this invitation.");
      router.replace(data.redirectTo || "/admin/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept this invitation.");
    } finally {
      setLoading(false);
    }
  }

  const currentEmail = session.data?.user.email;
  const emailMatches = Boolean(currentEmail && invitation && currentEmail.trim().toLowerCase() === invitation.email.toLowerCase());
  const verified = Boolean(session.data?.user.emailVerified);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="text-xs font-semibold tracking-[0.2em] text-neutral-700">LUNECRAFT</Link>
        <h1 className="mt-7 text-2xl font-semibold text-neutral-900">Join the LuneCraft team</h1>
        {invitation ? (
          <>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Invitation for <strong>{invitation.name}</strong> at <strong>{invitation.email}</strong>.</p>
            <p className="mt-3 text-sm text-neutral-600">Assigned roles: {invitation.roles.map(({ name }) => name).join(", ")}</p>
            {emailMatches && verified ? (
              <div className="mt-7 space-y-4">
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Verified as {currentEmail}. Accept to activate the listed admin roles.</p>
                <button disabled={loading} onClick={accept} className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Accepting..." : "Accept invitation"}</button>
              </div>
            ) : (
              <>
                {currentEmail && !emailMatches && <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">You are signed in as {currentEmail}. Sign out and use the invited email.</p>}
                {emailMatches && !verified && <div className="mt-5 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800"><p>Verify this email using the Better Auth verification link before accepting.</p><button type="button" onClick={async () => { const result = await authClient.sendVerificationEmail({ email: invitation.email, callbackURL: window.location.href }); if (result.error) setError(result.error.message || "Could not send the verification email."); else setMessage("A verification link has been sent, if email delivery is configured."); }} className="mt-2 font-medium underline">Send verification email again</button></div>}
                {!currentEmail && (
                  <div className="mt-7">
                    <div className="mb-4 flex gap-2 border-b border-neutral-200">
                      <button onClick={() => setMode("signup")} className={`px-2 pb-2 text-sm ${mode === "signup" ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}>Create account</button>
                      <button onClick={() => setMode("signin")} className={`px-2 pb-2 text-sm ${mode === "signin" ? "border-b-2 border-neutral-900 font-medium" : "text-neutral-500"}`}>Existing account</button>
                    </div>
                    <form onSubmit={handleAccount} className="space-y-3">
                      {mode === "signup" && <label className="block text-sm">Full name<input name="name" defaultValue={invitation.name} required maxLength={100} className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3" /></label>}
                      <label className="block text-sm">Email<input name="email" type="email" defaultValue={invitation.email} readOnly className="mt-1 h-10 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3" /></label>
                      <label className="block text-sm">Password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3" /></label>
                      <button disabled={loading} className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</button>
                    </form>
                  </div>
                )}
              </>
            )}
          </>
        ) : !error ? <p className="mt-4 text-sm text-neutral-500">Checking invitation...</p> : null}
        {message && <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="mt-6 text-xs leading-5 text-neutral-500">Invitation links expire after seven days and can only be accepted once by the verified invited email.</p>
      </section>
    </main>
  );
}
