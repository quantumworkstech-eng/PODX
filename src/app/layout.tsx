import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "PodX - Book Professional Podcast Studios Near You",
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
    title: "PodX - Book Professional Podcast Studios Near You",
    description:
      "Find and book fully equipped professional podcast studios in India. Instant booking, verified studios, transparent pricing.",
    type: "website",
    locale: "en_IN",
    siteName: "PodX",
  },
  twitter: {
    card: "summary_large_image",
    title: "PodX - Book Professional Podcast Studios Near You",
    description:
      "Find and book fully equipped professional podcast studios in India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${outfit.variable} ${dmSans.variable} scroll-smooth`}>
      <head>
        {/* Anti-FOUC: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('podx_theme')||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased font-[family-name:var(--font-dm-sans)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
