import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Chatbot } from "@/components/Chatbot";
import { headers } from "next/headers";
import { isMaintenanceMode } from "@/lib/platform-settings";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yanisa Studio - Book Professional Podcast Studios Near You",
  description:
    "India's premier podcast studio booking platform. Find and book fully equipped professional podcast studios in Mumbai, Delhi, Bangalore, and more. Instant booking, verified studios, transparent pricing.",
  keywords: [
    "podcast studio",
    "podcast recording",
    "studio booking",
    "podcast studio Mumbai",
    "podcast studio Delhi",
    "podcast studio Bangalore",
    "video podcast",
    "content creation studio",
  ],
  openGraph: {
    title: "Yanisa Studio - Book Professional Podcast Studios Near You",
    description:
      "Find and book fully equipped professional podcast studios in India. Instant booking, verified studios, transparent pricing.",
    type: "website",
    locale: "en_IN",
    siteName: "Yanisa Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yanisa Studio - Book Professional Podcast Studios Near You",
    description:
      "Find and book fully equipped professional podcast studios in India.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: `x-pathname` is set by `src/middleware.ts`.
  // headers() is async in Next.js 15 and must be awaited.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  return (
    <html lang="en" data-theme="dark" className={`${outfit.variable} ${dmSans.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background antialiased font-[family-name:var(--font-dm-sans)]">
        <Providers>
          {/* Maintenance mode applies to non-admin UI only */}
          <MaintenanceGate pathname={pathname}>{children}</MaintenanceGate>
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}

async function MaintenanceGate({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  if (pathname.startsWith("/admin")) return children;
  if (pathname.startsWith("/api")) return children;
  if (pathname.startsWith("/_next")) return children;

  const on = await isMaintenanceMode();
  if (!on) return children;
  return <MaintenanceScreen />;
}
