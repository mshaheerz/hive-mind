// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable the experimental appDir (App Router) if not already default
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
