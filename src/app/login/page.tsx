import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginShowcaseCarousel } from "@/components/auth/LoginShowcaseCarousel";

export const metadata: Metadata = {
  title: "Sign in - ANSH Bookings",
  description: "Sign in to your ANSH Bookings workspace",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-2">
        <div className="hidden border-r border-zinc-200 lg:block">
          <LoginShowcaseCarousel />
        </div>

        <div className="flex h-full min-h-screen items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
            <div />
            <Link
              href="/"
              className="text-xs font-medium text-[var(--app-primary)] transition hover:text-[var(--app-primary-hover)]"
            >
              Back to site
            </Link>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Welcome back!</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
              Simplify your scheduling workflow and keep meetings organized from one place.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
