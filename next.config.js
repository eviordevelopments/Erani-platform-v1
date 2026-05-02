/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Prevent webpack from bundling native Node modules that use pdfjs-dist internally.
  // These must run as true Node.js CJS modules, NOT in the RSC webpack sandbox.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'xlsx', 'csv-parse'],
  // Prevent ESLint warnings from failing CI builds on Netlify
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "platform.erani.mx",
      },
    ],
  },

  // Allow the platform subdomain during development previews
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
