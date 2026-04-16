import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const LAST_UPDATED = "16 April 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] pt-[calc(7.25rem+env(safe-area-inset-top,0px))] pb-10 text-[#0c1733] sm:pt-[calc(7.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(9.75rem+env(safe-area-inset-top,0px))]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#081430] sm:text-3xl">Terms & Conditions</h1>
          <p className="mt-2 text-sm text-zinc-600">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-6 text-sm leading-6 text-zinc-700">
            <section>
              <h2 className="text-base font-semibold text-zinc-900">1. Acceptance of Terms</h2>
              <p className="mt-2">
                These Terms & Conditions govern your use of ANSH Bookings, including our website, web application, and
                related services. By using ANSH Bookings, you agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">2. Service Description</h2>
              <p className="mt-2">
                ANSH Bookings is a scheduling and booking platform for individuals and businesses. Features may include
                booking links, availability management, notifications, integrations, subscription billing, and analytics.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">3. Account Responsibility</h2>
              <p className="mt-2">
                You are responsible for all activity under your account, including the security of your credentials and
                the accuracy of information you provide. You must promptly report unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">4. Subscription, Billing, and Renewal</h2>
              <p className="mt-2">
                Paid plans are billed in advance via our payment partner. You authorize us (and our payment processor)
                to charge applicable subscription fees, taxes, and related charges. Pricing, feature limits, and plan
                terms may be updated with prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">5. Cancellation and No-Refund Policy</h2>
              <p className="mt-2">
                You may cancel your subscription at any time. Your access to paid features continues until the end of
                the current billing cycle. However, all fees paid are non-refundable.
              </p>
              <p className="mt-2">
                <strong>No refunds are provided</strong> for:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Subscription cancellation by the user.</li>
                <li>Account deletion by the user.</li>
                <li>Partial usage or non-usage during an active billing period.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">6. Acceptable Use</h2>
              <p className="mt-2">
                You must not misuse the service, attempt unauthorized access, reverse engineer critical components,
                distribute malware, or use the platform in violation of applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">7. Data, Privacy, and Compliance</h2>
              <p className="mt-2">
                Your use of the service is also governed by our{" "}
                <Link href="/privacy" className="text-[#2a38ff] hover:underline">
                  Privacy Policy
                </Link>
                . We follow applicable Indian legal requirements, including relevant provisions under the Information
                Technology Act, 2000 and evolving requirements under India&apos;s Digital Personal Data Protection
                framework.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">8. Service Availability</h2>
              <p className="mt-2">
                We aim for reliable availability but do not guarantee uninterrupted service. We may perform maintenance,
                updates, and emergency fixes that can temporarily affect access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">9. Limitation of Liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, ANSH Bookings is not liable for indirect, incidental, special,
                or consequential damages. Our aggregate liability for claims related to paid services is limited to the
                subscription fees paid by you for the affected billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">10. Governing Law and Jurisdiction</h2>
              <p className="mt-2">
                These terms are governed by the laws of India. Courts with competent jurisdiction in India will have
                jurisdiction over disputes arising out of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900">11. Contact</h2>
              <p className="mt-2">
                For legal, billing, or policy questions, contact us at{" "}
                <a href="mailto:support@bookings.anshapps.in" className="text-[#2a38ff] hover:underline">
                  support@bookings.anshapps.in
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
