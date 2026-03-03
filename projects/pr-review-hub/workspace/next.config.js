/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are only enabled in development (or when explicitly allowed).
    // In production they stay disabled unless both conditions are true.
    serverActions:
      process.env.NODE_ENV === 'development' &&
      process.env.ENABLE_SERVER_ACTIONS === 'true',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  // Security‑related HTTP headers
  async headers() {
    // Generate a nonce for inline styles (if ever needed). For now we avoid
    // unsafe‑inline completely and rely on Tailwind‑generated external CSS.
    const styleNonce = ''; // placeholder – can be populated via a middleware if required
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; img-src https: data:; script-src 'self'; style-src 'self'${styleNonce ? ` 'nonce-${styleNonce}'` : ''}; connect-src 'self' https://api.github.com;`,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
