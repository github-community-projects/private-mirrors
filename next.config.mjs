import './env.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
}

export default nextConfig
