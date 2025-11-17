import type { NextConfig } from "next"

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lxbvoqdvdbhmufga.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
}

module.exports = nextConfig
