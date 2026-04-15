"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay after the block enters the viewport (stagger children with different values). */
  delayMs?: number;
};

export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    // Keep above-the-fold content visible by default; only hide for scroll-in sections.
    const rect = el.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top > viewport * 0.9) {
      setVisible(false);
    }
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const style = { "--reveal-delay": `${delayMs}ms` } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      data-reveal-state={visible ? "visible" : "hidden"}
      className={[
        "app-reveal",
        className.trim(),
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
