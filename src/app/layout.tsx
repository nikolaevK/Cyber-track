import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// On Vercel the production URL is known without configuration, so a temporary *.vercel.app domain works as is.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Brand my garage", template: "%s · Brand my garage" },
  description:
    "Advertising panels on a real Cybertruck, G-Wagon and 911 GT3. Fixed prices that add up to each car, on it for life, bought in one click.",
  openGraph: {
    title: "Your brand on my car.",
    description:
      "Advertising panels on a real Cybertruck, G-Wagon and 911 GT3. Fixed prices that add up to each car, on it for life.",
    images: ["/renders/cybertruck/front-34.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
