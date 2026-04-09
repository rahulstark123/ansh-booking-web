import type { ReactNode } from "react";

import { Reveal } from "@/components/Reveal";

const ROW_ONE = [
  "Retail Store",
  "Construction",
  "Finance",
  "Events",
  "Hotel",
  "Education",
  "Health Care",
  "Manufacturing",
] as const;

const ROW_TWO = [
  "Logistics",
  "Real Estate",
  "Restaurant",
  "Automotive",
  "Travel",
  "Consulting",
  "Wellness",
  "Corporate",
] as const;

/** Matches feature-card icon circles in `page.tsx` (blue row / orange row). */
function IconFrame({
  children,
  accent,
}: {
  children: ReactNode;
  accent: "ember" | "violet";
}) {
  const shell =
    accent === "ember"
      ? "bg-[#e8eaff] text-[#2a38ff]"
      : "bg-[#ffe9d8] text-[#c2410c]";

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${shell}`}
    >
      {children}
    </span>
  );
}

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ?? "h-6 w-6"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IndustryIcon({ name, accent }: { name: string; accent: "ember" | "violet" }) {
  const glyph = (() => {
    switch (name) {
      case "Retail Store":
        return (
          <Svg>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </Svg>
        );
      case "Construction":
        return (
          <Svg>
            <path d="M2 22h20M7 22V10l5-5 5 5v12M10 22v-6h4v6" />
            <path d="M12 5V2" />
          </Svg>
        );
      case "Finance":
        return (
          <Svg>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </Svg>
        );
      case "Events":
        return (
          <Svg>
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path d="M12 14v4M10 16h4" />
          </Svg>
        );
      case "Hotel":
        return (
          <Svg>
            <path d="M2 20h20" />
            <path d="M4 20V12a2 2 0 0 1 2-2h2" />
            <path d="M18 10h2a2 2 0 0 1 2 2v8" />
            <path d="M2 14h20" />
            <path d="M8 10V8M16 10V8" />
          </Svg>
        );
      case "Education":
        return (
          <Svg>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8M8 11h6" />
          </Svg>
        );
      case "Health Care":
        return (
          <Svg>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" />
          </Svg>
        );
      case "Manufacturing":
        return (
          <Svg>
            <path d="M2 20h20M5 20V10l3 2v8M10 20V8l3 2v10M15 20v-6l3-2v8" />
            <circle cx="18" cy="5" r="2" />
            <path d="M16 7l-2 3h4l-2-3" />
          </Svg>
        );
      case "Logistics":
        return (
          <Svg>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18h2M15 6h3l4 4v8a1 1 0 0 1-1 1h-1" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </Svg>
        );
      case "Real Estate":
        return (
          <Svg>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </Svg>
        );
      case "Restaurant":
        return (
          <Svg>
            <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M7 2v20" />
            <path d="M17 8v12a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8" />
            <path d="M21 8a4 4 0 0 0-4-4h0a4 4 0 0 0-4 4" />
          </Svg>
        );
      case "Automotive":
        return (
          <Svg>
            <path d="M19 17h2l.5-2M5 17H3l-.5-2M7 17h10" />
            <path d="M5 17a2 2 0 1 0 4 0 4 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 4 0 0 0-4 0z" />
            <path d="M5.5 15L7 10h10l1.5 5M7 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </Svg>
        );
      case "Travel":
        return (
          <Svg>
            <path d="M17.8 19.2L16 11l3.5-2.5a2.5 2.5 0 0 0 0-4L16 2 9 9H5a2 2 0 0 0-2 2v2h4l-1.2 8.2" />
            <path d="M9 22h6" />
          </Svg>
        );
      case "Consulting":
        return (
          <Svg>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M9 10h.01M12 10h.01M15 10h.01" />
          </Svg>
        );
      case "Wellness":
        return (
          <Svg>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
          </Svg>
        );
      case "Corporate":
        return (
          <Svg>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M6 12h12" />
            <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
          </Svg>
        );
      default:
        return (
          <Svg>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </Svg>
        );
    }
  })();

  return <IconFrame accent={accent}>{glyph}</IconFrame>;
}

function MarqueeRow({
  labels,
  reverse,
  accent,
}: {
  labels: readonly string[];
  /** When true, scrolls right (opposite of first row). */
  reverse?: boolean;
  accent: "ember" | "violet";
}) {
  const loop = [...labels, ...labels];

  return (
    <div className="app-marquee-fade relative w-full overflow-hidden py-1">
      <div
        className={[
          "app-marquee-track flex w-max gap-4 pr-4",
          reverse ? "app-marquee-track--reverse" : "app-marquee-track--forward",
        ].join(" ")}
      >
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex shrink-0 items-center gap-3 rounded-2xl border border-[#e8eaf4] bg-[#f6f7fc] px-4 py-3 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:px-5 sm:py-3.5"
          >
            <IndustryIcon name={label} accent={accent} />
            <span className="app-card-title text-sm sm:text-base">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function WhoCanBookMarquee() {
  return (
    <section
      id="who-can-book"
      className="app-section app-accent-bg-dark bg-black"
      aria-labelledby="who-can-book-heading"
    >
      <Reveal className="w-full">
        <div className="app-container">
          <div className="text-center">
            <p className="app-eyebrow app-eyebrow--inverse">Industries</p>
            <h2 id="who-can-book-heading" className="app-section-title app-section-title--inverse mt-4">
              Who can book?
            </h2>
            <p className="app-section-lead app-section-lead--inverse app-section-lead--center mt-3 max-w-md">
              One link works for clinics, studios, agencies, and teams — wherever time needs to be shared.
            </p>
          </div>

          <div className="app-section-body space-y-5 md:space-y-6">
            <MarqueeRow labels={ROW_ONE} accent="ember" />
            <MarqueeRow labels={ROW_TWO} accent="violet" reverse />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
