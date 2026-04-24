import Link from "next/link";
import type { Metadata } from "next";

import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create account - ANSH Bookings",
  description: "Create your ANSH Bookings workspace account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left Side: Premium Showcase */}
        <div className="hidden lg:block relative overflow-hidden">
          <AuthShowcase />
        </div>

        {/* Right Side: Signup Form */}
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 xl:p-24 bg-white relative overflow-hidden">
          {/* Subtle background element for form side */}
          <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-blue-50/30 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="w-full max-w-[400px] relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div />
              <Link
                href="/"
                className="text-xs font-semibold text-teal-600 uppercase tracking-wider hover:text-teal-700 transition-colors"
              >
                Back to site
              </Link>
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Create account
              </h1>
              <p className="mt-3 text-zinc-600 leading-relaxed">
                Join thousands of teams managing their scheduling with ANSH.
              </p>
            </div>

            <SignupForm />
            
            <div className="mt-10 pt-8 border-t border-zinc-100">
              <p className="text-center text-sm text-zinc-500">
                &copy; {new Date().getFullYear()} ANSH Bookings. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
