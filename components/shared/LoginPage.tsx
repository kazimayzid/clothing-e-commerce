"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import AuthSwitchLink from "./AuthSwitchLink";
type Props = {
  children?: ReactNode;
};
export default function LoginPage({children}: Props) {
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
    try {
      setServerError(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Authenticated payload:", data);
    } catch {
      setServerError("Invalid email or password. Please try again.");
    }
  };
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-neutral-50 px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-lg shadow-sm p-8 md:p-10 font-sans">
        {/* Brand / Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold tracking-luxury text-neutral-900 mb-2"
          >
            CHARLES &amp; KEITH
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
            {serverError}
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs tracking-luxury font-semibold text-neutral-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register("email")}
                className={`w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border rounded outline-none transition-colors ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="password"
                className="text-xs tracking-luxury font-semibold text-neutral-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full pl-9 pr-10 py-2.5 text-sm bg-transparent border rounded outline-none transition-colors ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-xs text-neutral-600 cursor-pointer select-none"
            >
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white py-3 px-4 text-xs tracking-luxury font-bold rounded transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
       

        <div className="text-center">
         {children}
        </div>
       
      </div>
    </main>
  );
}
