import { BookingCalendarMockup } from "@/components/BookingCalendarMockup";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { WhoCanBookMarquee } from "@/components/WhoCanBookMarquee";

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 14h.01M12 14h.01M16.5 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Smart Scheduling",
    description: "AI-powered buffers and intelligent conflict detection for your busy day.",
    Icon: IconCalendar,
    circle: "bg-[#e8eaff]",
    iconClass: "text-[#2a38ff]",
  },
  {
    title: "Instant Links",
    description: "Beautifully customized booking pages that convert visitors into clients.",
    Icon: IconLink,
    circle: "bg-[#ffe9d8]",
    iconClass: "text-[#c2410c]",
  },
  {
    title: "Client CRM",
    description: "Centralized database for all client histories, notes, and preferences.",
    Icon: IconUsers,
    circle: "bg-[#ffe9d8]",
    iconClass: "text-[#c2410c]",
  },
  {
    title: "Auto Reminders",
    description: "Reduce no-shows by up to 80% with automated WhatsApp and SMS alerts.",
    Icon: IconBell,
    circle: "bg-[#e8eaff]",
    iconClass: "text-[#2a38ff]",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: 1,
    title: "Set Availability",
    body: "Sync your calendar and define your working hours and buffers.",
    variant: "solid" as const,
  },
  {
    step: 2,
    title: "Share Link",
    body: "Embed on your site or send your custom link to clients directly.",
    variant: "outline" as const,
  },
  {
    step: 3,
    title: "Get Booked",
    body: "Payments, confirmations, and reminders all happen on autopilot.",
    variant: "orange" as const,
  },
];

const PREMIUM_POINTS = [
  "Mobile-first responsive design",
  "Integrated Indian payment gateways",
  "Multi-timezone support for global clients",
];

const PRICING_PLANS = [
  {
    name: "Free Plan",
    blurb: "For individuals getting started.",
    price: "₹0",
    period: "/mo",
    features: ["Up to 20 bookings / month", "Single booking link", "Basic Email alerts"],
    checkVariant: "green" as const,
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro Plan",
    blurb: "For growing businesses and professionals.",
    price: "₹199",
    period: "/mo",
    features: [
      "Unlimited bookings",
      "WhatsApp & SMS Integration",
      "Custom Domain Branding",
      "Advanced Revenue Analytics",
    ],
    checkVariant: "purple" as const,
    cta: "Go Pro",
    featured: true,
    badge: "RECOMMENDED",
  },
] as const;

const VISION_BELIEFS = [
  "Technology should be simple",
  "Tools should be accessible",
  "Software should not feel like work",
] as const;

function PricingCheck({ variant }: { variant: "green" | "purple" }) {
  const stroke = variant === "green" ? "#16a34a" : "#2a38ff";
  return (
    <svg className="mt-0.5 h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckOrange({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2772f] ${className ?? ""}`}
    >
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#f7f9ff] text-[#0c1733]">
      {/* Hero wash from the very top (sits behind the fixed navbar) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(92vh,58rem)] overflow-hidden"
        aria-hidden
      >
        <div className="app-hero-aurora" />
      </div>

      <SiteHeader />

      <main className="relative z-[1] w-full overflow-x-clip pt-[calc(7.25rem+env(safe-area-inset-top,0px))] pb-16 sm:pt-[calc(7.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(9.75rem+env(safe-area-inset-top,0px))] md:pb-20 lg:pb-24 xl:pb-28">
        <div className="app-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12 xl:gap-16">
          <section className="flex flex-col items-start text-left">
            <Reveal className="w-full max-w-xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-[#5f6981] uppercase sm:text-sm">
                Simple • Fast • Reliable
              </p>
              <h1 className="mt-4 max-w-xl text-[clamp(1.875rem,3.5vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-[#081430]">
                &ldquo;Bharat books with <span className="text-[#2a38ff]">ANSH Bookings</span>.&rdquo;
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#5f6981] sm:text-lg">
                No spreadsheets. No double bookings. No endless messages just to find a free slot.
              </p>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[#5f6981] sm:text-lg">
                Just one booking link. For clients to pick a time. For you to stay organised. For your day to run
                smoother.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="rounded-full bg-[#2a38ff] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,56,255,0.22)] transition-transform duration-200 hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(42,56,255,0.28)] active:scale-[0.98] sm:px-8 sm:py-3 sm:text-base"
                >
                  Get Started
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-[#c9d4f8] bg-white px-7 py-2.5 text-sm font-semibold text-[#2a38ff] transition-all duration-200 hover:border-[#2a38ff]/30 hover:bg-[#f4f7ff] hover:shadow-[0_6px_20px_rgba(42,56,255,0.1)] sm:px-8 sm:py-3 sm:text-base"
                >
                  Explore Features
                </a>
              </div>
            </Reveal>
          </section>

          <section className="flex w-full items-center justify-center lg:justify-end">
            <Reveal className="w-full max-w-xl lg:max-w-none" delayMs={90}>
              <div className="app-mock-hero w-full">
                <BookingCalendarMockup />
              </div>
            </Reveal>
          </section>
        </div>
      </main>

      <section id="vision" className="app-section app-accent-bg-dark bg-black" aria-labelledby="vision-heading">
        <div className="app-container grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="w-full">
            <div>
              <p className="app-eyebrow app-eyebrow--inverse">Our vision</p>
              <h2 id="vision-heading" className="app-section-title app-section-title--inverse mt-4">
                &ldquo;Built for Bharat. Ready for the World.&rdquo;
              </h2>
              <p className="app-body app-body--inverse mt-6 max-w-xl">
                We are not here to build complicated software.
              </p>
              <p className="app-body app-body--inverse mt-4 max-w-xl">
                We are here to solve real problems. For real people. In simple ways.
              </p>
            </div>
          </Reveal>

          <Reveal className="w-full" delayMs={100}>
            <div className="app-vision-card rounded-2xl border border-white/10 bg-[#141416] p-8 sm:p-10">
              <p className="text-xs font-medium leading-relaxed tracking-[0.12em] text-white italic uppercase sm:text-sm">
                India is not just a market. It is a movement. A movement of builders. A movement of dreamers. A
                movement of doers.
              </p>
              <p className="app-bold-inverse mt-8">We believe:</p>
              <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-[#a1a1aa]">
                {VISION_BELIEFS.map((line) => (
                  <li key={line} className="app-body app-body--inverse">
                    {line}
                  </li>
                ))}
              </ul>
              <hr className="my-8 border-white/15" />
              <p className="text-xl font-bold text-white sm:text-2xl">From Bharat to the world.</p>
              <p className="app-body app-body--inverse mt-3 text-[#9ca3af]">
                Inspired by Vasudhaiva Kutumbakam — The world is one family.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="app-section app-accent-bg-dark bg-black" aria-labelledby="features-heading">
        <div className="app-container">
          <Reveal className="text-center">
            <h2 id="features-heading" className="app-section-title app-section-title--inverse">
              Precision Built Features
            </h2>
            <p className="app-section-lead app-section-lead--inverse app-section-lead--center max-w-3xl">
              Engineered to handle the complexity of professional service management without the clutter.
            </p>
          </Reveal>

          <div className="app-section-body grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {FEATURES.map(({ title, description, Icon, circle, iconClass }, i) => (
              <Reveal key={title} delayMs={i * 70}>
                <article className="group app-hover-lift flex h-full flex-col items-start rounded-2xl border border-[#e8eaf4] bg-[#f6f7fc] p-6 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-7">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${circle} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}
                  >
                    <Icon className={`h-6 w-6 ${iconClass}`} />
                  </div>
                  <h3 className="app-card-title mt-5">{title}</h3>
                  <p className="app-body app-body--light mt-3">{description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="section-3"
        className="app-section app-section-grid-light bg-[#f3f4ff]"
        aria-labelledby="journey-heading"
      >
        <div className="app-container">
          <Reveal className="w-full">
            <h2 id="journey-heading" className="app-section-title app-section-title--light text-center">
              The 3-Step Journey
            </h2>

            <div className="relative mt-10 md:mt-12">
              <div
                className="pointer-events-none absolute top-8 right-[8%] left-[8%] z-0 hidden md:block"
                aria-hidden
              >
                <div className="app-journey-line" />
              </div>

              <div className="relative z-10 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
                {JOURNEY_STEPS.map(({ step, title, body, variant }) => (
                  <div key={step} className="flex flex-col items-center text-center">
                    <div
                      className={[
                        "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold transition-transform duration-300 hover:scale-105",
                        variant === "solid" &&
                          "bg-[#2a38ff] text-white shadow-[0_6px_18px_rgba(42,56,255,0.28)]",
                        variant === "outline" &&
                          "border-2 border-[#2a38ff] bg-white text-[#2a38ff] shadow-[0_6px_18px_rgba(42,56,255,0.12)]",
                        variant === "orange" &&
                          "bg-[#c2410c] text-white shadow-[0_6px_18px_rgba(194,65,12,0.28)]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {step}
                    </div>
                    <h3 className="app-step-title mt-5">{title}</h3>
                    <p className="app-body app-body--light mt-2 max-w-[17rem] text-[#5b6b8c]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <WhoCanBookMarquee />

      <section id="section-4" className="app-section app-accent-bg-dark bg-black" aria-labelledby="premium-heading">
        <div className="app-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="w-full">
            <div>
              <h2 id="premium-heading" className="app-section-title app-section-title--inverse">
                Premium Experience for Your Clients
              </h2>
              <p className="app-section-lead app-section-lead--inverse mt-3 max-w-xl">
                Your booking page is a reflection of your brand. We make sure it feels premium, professional, and
                effortless to use.
              </p>
              <ul className="app-section-body flex flex-col gap-5">
                {PREMIUM_POINTS.map((line) => (
                  <li key={line} className="flex items-start gap-4 text-left">
                    <CheckOrange />
                    <span className="app-body app-body--inverse pt-1 text-[#d1d5db]">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="flex w-full justify-center lg:justify-end" delayMs={100}>
            <div className="app-mock-float w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_24px_64px_rgba(0,0,0,0.45)] transition-shadow duration-500 hover:shadow-[0_28px_72px_rgba(0,0,0,0.5)] sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8eaff]">
                  <IconUser className="h-8 w-8 text-[#2a38ff]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0a1628]">Dr. Aryan Sharma</p>
                  <p className="mt-0.5 text-base text-[#6b7280]">Consulting Specialist</p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-[#eef1ff] px-5 py-4">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b7280] uppercase">Select service</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold text-[#0a1628]">Initial Consultation</span>
                  <span className="text-lg font-bold text-[#2a38ff]">₹1,500</span>
                </div>
              </div>

              <p className="mt-8 text-[11px] font-semibold tracking-[0.15em] text-[#6b7280] uppercase">Select date</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: "Mon 12", active: true },
                  { label: "Tue 13", active: false },
                  { label: "Wed 14", active: false },
                  { label: "Thu 15", active: false },
                ].map(({ label, active }) => (
                  <button
                    key={label}
                    type="button"
                    className={[
                      "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-[#2a38ff] text-white shadow-sm"
                        : "border border-[#e5e7eb] bg-white text-[#374151]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="mt-8 text-[11px] font-semibold tracking-[0.15em] text-[#6b7280] uppercase">Select time</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="min-w-[7.5rem] flex-1 rounded-2xl bg-[#dbeafe] px-5 py-3.5 text-center text-base font-semibold text-[#1e3a8a]"
                >
                  10:00 AM
                </button>
                <button
                  type="button"
                  className="min-w-[7.5rem] flex-1 rounded-2xl bg-[#e8eaff] px-5 py-3.5 text-center text-base font-semibold text-[#2a38ff] ring-2 ring-[#2a38ff]/30"
                >
                  11:30 AM
                </button>
              </div>

              <button
                type="button"
                className="mt-10 w-full rounded-2xl bg-[#2a38ff] py-4 text-lg font-bold text-white shadow-[0_8px_24px_rgba(42,56,255,0.4)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Confirm Booking
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="pricing"
        className="app-section app-section-grid-light bg-[#f3f4ff]"
        aria-labelledby="pricing-heading"
      >
        <div className="app-container">
          <Reveal className="text-center">
            <h2 id="pricing-heading" className="app-section-title app-section-title--light">
              Scalable Pricing
            </h2>
            <p className="app-section-lead app-section-lead--light app-section-lead--center">
              Choose the plan that matches your current scale.
            </p>
          </Reveal>

          <div className="app-section-body grid gap-8 lg:grid-cols-2 lg:gap-10">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.name} delayMs={i * 80}>
                <article
                  className={[
                    "app-hover-lift relative flex h-full flex-col rounded-[2rem] bg-white p-8 sm:p-10",
                    plan.featured
                      ? "shadow-[0_20px_50px_rgba(7,24,79,0.12)] ring-1 ring-[#e5e7eb]"
                      : "shadow-[0_8px_30px_rgba(7,24,79,0.06)]",
                  ].join(" ")}
                >
                {plan.featured && plan.badge && (
                  <span className="absolute top-6 right-6 rounded-full bg-[#92400e] px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                    {plan.badge}
                  </span>
                )}
                <h3 className="app-card-title">{plan.name}</h3>
                <p className="app-body app-body--light mt-2 text-base text-[#6b7280] sm:text-lg">{plan.blurb}</p>
                <p className="mt-8 flex items-baseline gap-0.5">
                  <span className="text-4xl font-extrabold tracking-tight text-[#0a1628] sm:text-5xl">
                    {plan.price}
                  </span>
                  <span className="text-lg font-semibold text-[#6b7280] sm:text-xl">{plan.period}</span>
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {plan.features.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-left">
                      <PricingCheck variant={plan.checkVariant} />
                      <span className="app-body pt-0.5 text-[#374151]">{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={[
                    "mt-12 w-full rounded-full py-4 text-lg font-semibold transition-all duration-200 hover:opacity-95 active:scale-[0.99]",
                    plan.featured
                      ? "bg-[#2a38ff] text-white shadow-[0_8px_24px_rgba(42,56,255,0.35)] hover:shadow-[0_12px_28px_rgba(42,56,255,0.42)]"
                      : "bg-[#e8eeff] text-[#2a38ff] hover:bg-[#dce4ff]",
                  ].join(" ")}
                >
                  {plan.cta}
                </button>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="app-section app-accent-bg-dark bg-black" aria-label="Tagline">
        <div className="app-container">
          <Reveal className="text-center">
            <p className="app-tagline app-tagline-shimmer">Less Noise. More Impact.</p>
          </Reveal>
        </div>
      </section>

      <footer className="w-full border-t border-[#e5e7eb] bg-[#f9fafb]">
        <Reveal className="w-full">
          <div className="app-container flex flex-col gap-10 py-12 md:flex-row md:items-center md:justify-between md:py-14">
          <div>
            <p className="app-card-title text-[#1e1b4b]">ANSH Bookings</p>
            <p className="app-body app-body--light mt-2 text-base text-[#6b7280]">
              © 2026 ANSH Bookings. Crafted with Flow.
            </p>
          </div>
          <nav
            className="app-body flex flex-wrap items-center gap-x-8 gap-y-3 text-[#6b7280]"
            aria-label="Footer"
          >
            <a href="#" className="transition-colors hover:text-[#374151]">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-[#374151]">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-[#374151]">
              Security
            </a>
            <a href="#" className="transition-colors hover:text-[#374151]">
              Status
            </a>
          </nav>
        </div>
        </Reveal>
      </footer>
    </div>
  );
}
