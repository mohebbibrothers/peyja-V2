/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js dev server blocks requests whose Origin/Referer host is not the
  // host it started with. A public tunnel (ngrok / Cloudflare) has a different
  // host, so without this the page loads blank (white) through the tunnel.
  // Hostnames only — no scheme, no port. `*` = one label, `**` = one or more.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.ngrok-free.dev",
    "**.ngrok-free.dev",
    "*.ngrok-free.app",
    "**.ngrok-free.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "*.e2b.app",
    "*.loca.lt",
  ],
};

export default nextConfig;
