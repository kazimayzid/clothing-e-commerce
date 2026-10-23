
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Eye } from "lucide-react";

import AuthSwitchLink from "@/components/shared/AuthSwitchLink";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create your account.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="size-6" strokeWidth={1.5} />

          <span className="text-xl font-semibold tracking-[0.18em]">
            YOUR BRAND
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Join us for a more personalized shopping experience.
          </p>
        </div>

        {/* Sign-up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              required
              maxLength={100}
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                required
                minLength={8}
                maxLength={128}
                className="h-11 w-full rounded-lg border border-neutral-300 px-3 pr-10 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />

              <Eye className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              required
              minLength={8}
              maxLength={128}
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-0.5 size-4 accent-neutral-900"
            />

            <label
              htmlFor="terms"
              className="text-sm leading-5 text-neutral-600"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Sign-in link */}
        <div className="mt-7">
          <AuthSwitchLink
            message="Already have an account?"
            linkText="Sign in"
            href="/sign-in"
          />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          A better shopping experience starts here.
        </p>
      </div>
    </main>
  );
}
