import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Montserrat, Outfit, Roboto } from "next/font/google";

import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookings.anshapps.in"),
  title: {
    default: "ANSH Bookings | Effortless Scheduling for Professionals",
    template: "%s | ANSH Bookings",
  },
  description: "ANSH Bookings is the most powerful scheduling and booking platform built for Bharat. Manage appointments, sync calendars, and automate client reminders with ease.",
  keywords: [
    "Booking Software",
    "Scheduling App",
    "Appointment Management",
    "Calendar Sync",
    "Bharat Booking",
    "ANSH Bookings",
    "Business Automation",
    "India Scheduling Tool",
  ],
  authors: [{ name: "Ansh Apps Team" }],
  creator: "Ansh Apps",
  publisher: "Ansh Apps",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bookings.anshapps.in",
    siteName: "ANSH Bookings",
    title: "ANSH Bookings | Effortless Scheduling for Professionals",
    description: "The most powerful scheduling platform built for Bharat. Simplify your bookings and grow your business.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ANSH Bookings - Effortless Scheduling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSH Bookings | Effortless Scheduling",
    description: "Simplify your bookings with the most powerful scheduling platform built for Bharat.",
    images: ["/og-image.png"],
    creator: "@anshapps",
  },
  verification: {
    google: "6NT93y8x-9C64bHtGg16eLSai-vwWV4xodUzYOsdqoE",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${outfit.variable} ${roboto.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-screen w-full bg-[var(--background)] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
