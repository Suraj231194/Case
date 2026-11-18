import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const description =
  "Follow the eight-step journey from your imagination to a beautifully personalized phone case.";

export const metadata: Metadata = {
  title: "Case Studio — Made of your imagination",
  description,
  applicationName: "Case Studio",
  openGraph: {
    type: "website",
    siteName: "Case Studio",
    title: "Case Studio — Made of your imagination",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studio — Made of your imagination",
    description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070b0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
