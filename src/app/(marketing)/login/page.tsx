import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export const metadata: Metadata = {
  title: "Sign in - ANSH Bookings",
  description: "Sign in to your ANSH Bookings workspace",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left Side: Premium Showcase */}
        <div className="hidden lg:block relative overflow-hidden">
          <AuthShowcase />
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 xl:p-24 bg-white relative overflow-hidden">
          {/* Subtle background element for form side */}
          <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-teal-50/30 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="w-full max-w-[400px] relative z-10">
            <div className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-zinc-600 leading-relaxed">
                Log in to your account to manage your bookings and team.
              </p>
            </div>

            <LoginForm />
            
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
