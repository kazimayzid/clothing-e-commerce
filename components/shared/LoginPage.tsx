
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";

type Props = {
  children?: ReactNode;
  callbackURL?: string;
  heading?: string;
  description?: string;
};

export default function LoginPage({
  children,
  callbackURL = "/",
  heading = "Welcome Back",
  description = "Enter your credentials to access your account",
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: data.email.trim(),
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL,
      });

      if (error) {
        setServerError(
          "Invalid email or password. Please try again."
        );
      }
    } catch {
      setServerError(
        "Unable to sign in right now. Please try again."
      );
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-neutral-50 px-4 py-12 font-sans">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
        {/* Brand / Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-2 text-2xl font-bold tracking-luxury text-neutral-900"
          >
            CHARLES &amp; KEITH
          </Link>

          <h1 className="text-xl font-bold text-neutral-900">
            {heading}
          </h1>

          <p className="mt-1 text-xs text-neutral-500 md:text-sm">
            {description}
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            {serverError}
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold tracking-luxury text-neutral-700"
            >
              Email Address
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Mail className="h-4 w-4" />
              </div>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "email-error" : undefined
                }
                {...register("email")}
                className={`w-full rounded border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none transition-colors ${
                  errors.email
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                }`}
              />
            </div>

            {errors.email && (
              <p
                id="email-error"
                className="mt-1 text-[11px] font-medium text-red-600"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-luxury text-neutral-700"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Lock className="h-4 w-4" />
              </div>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
                className={`w-full rounded border bg-transparent py-2.5 pl-9 pr-10 text-sm outline-none transition-colors ${
                  errors.password
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 transition-colors hover:text-neutral-700"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.password && (
              <p
                id="password-error"
                className="mt-1 text-[11px] font-medium text-red-600"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-neutral-900 focus:ring-neutral-900"
            />

            <label
              htmlFor="rememberMe"
              className="ml-2 block cursor-pointer select-none text-xs text-neutral-600"
            >
              Remember me on this device
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-neutral-900 px-4 py-3 text-xs font-bold tracking-luxury text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Reusable footer */}
        {children && (
          <div className="mt-7 text-center">
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
