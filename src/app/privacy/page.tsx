import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const LAST_UPDATED = "16 April 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] pt-[calc(7.25rem+env(safe-area-inset-top,0px))] pb-10 text-[#0c1733] sm:pt-[calc(7.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(9.75rem+env(safe-area-inset-top,0px))]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#081430] sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-zinc-600">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-6 text-sm leading-6 text-zinc-700">
            <section>
              <h2 className="text-base font-semibold text-zinc-900">1. Introduction</h2>
              <p className="mt-2">
                This Privacy Policy explains how ANSH Bookings collects, uses, stores, and protects personal data when
                you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">2. Information We Collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Account information: name, email address, profile details.</li>
                <li>Booking information: meeting details, invitee details, notes, and schedule preferences.</li>
                <li>Payment metadata: transaction IDs, subscription status, billing timestamps.</li>
                <li>Technical data: device/browser data, IP-derived region, logs, and diagnostics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">3. How We Use Data</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>To provide booking, scheduling, and account features.</li>
                <li>To process subscriptions and payment verification.</li>
                <li>To send confirmations, service updates, and support communications.</li>
                <li>To improve reliability, security, and product experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">4. Legal Basis and Consent</h2>
              <p className="mt-2">
                Where required, we process personal data based on consent, contractual necessity, legal obligations, or
                legitimate business interests. You may withdraw consent where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">5. Data Sharing</h2>
              <p className="mt-2">
                We may share data with trusted service providers required to deliver core features (for example,
                authentication, hosting, email, calendar, or payments), subject to contractual safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">6. Data Retention</h2>
              <p className="mt-2">
                We retain personal data only as long as necessary for service delivery, legal compliance, dispute
                resolution, and security. Data may be deleted or anonymized when no longer required.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">7. Your Rights</h2>
              <p className="mt-2">Subject to applicable law, you may request access, correction, or deletion of your personal data.</p>
              <p className="mt-2">
                For requests, contact{" "}
                <a href="mailto:support@bookings.anshapps.in" className="text-[#2a38ff] hover:underline">
                  support@bookings.anshapps.in
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">8. Security</h2>
              <p className="mt-2">
                We implement reasonable technical and organizational safeguards to protect personal data from
                unauthorized access, loss, misuse, or alteration.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">9. India-Specific Compliance Note</h2>
              <p className="mt-2">
                We aim to align privacy operations with applicable Indian law, including relevant requirements under the
                Information Technology Act, 2000 and India&apos;s evolving digital personal data protection framework.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">10. Billing and Refund Clarification</h2>
              <p className="mt-2">
                Payment and subscription terms (including cancellation and refund position) are described in our{" "}
                <Link href="/terms" className="text-[#2a38ff] hover:underline">
                  Terms & Conditions
                </Link>
                . For clarity, ANSH Bookings does not provide refunds for user-initiated subscription cancellation or
                account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">11. Policy Updates</h2>
              <p className="mt-2">
                We may update this policy from time to time. Material updates will be reflected on this page with a
                revised &quot;Last updated&quot; date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
