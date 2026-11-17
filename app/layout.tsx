import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Case Studio — Made of your imagination",
  description:
    "Follow the eight-step journey from your imagination to a beautifully personalized phone case.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
