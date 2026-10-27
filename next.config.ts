import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev: không dùng lại kết quả fetch cũ khi router.refresh(), để hành vi giống production.
  experimental: { serverComponentsHmrCache: false },
};

export default nextConfig;
