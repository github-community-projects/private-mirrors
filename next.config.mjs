import './env.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Let `next dev` serve the public URL (e.g. a tunnel) set in NEXTAUTH_URL
  allowedDevOrigins: process.env.NEXTAUTH_URL
    ? [new URL(process.env.NEXTAUTH_URL).hostname]
    : [],
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
}

export default nextConfig
