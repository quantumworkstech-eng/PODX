import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Behind the Coolify/Traefik reverse proxy the browser's Origin
  // (e.g. https://studios.yanisa.in) does not match the internal Host the
  // container sees, so Next.js rejects Server Action POSTs with
  // "Invalid Server Actions request." (surfaces in the UI as
  // "Something went wrong. Please try again." on admin login/creation).
  // Whitelist the production origins so the CSRF check passes. Keep this in
  // sync with MAIN_HOSTS in src/middleware.ts.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "yanisa.in",
        "www.yanisa.in",
        "studios.yanisa.in",
        "yanisastudios.com",
        "www.yanisastudios.com",
        "podx.com",
        "www.podx.com",
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
