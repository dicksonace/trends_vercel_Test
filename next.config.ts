import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '488062069123-dd7r1fu1a3tq1a5rm03mhv0kbij1f3bk.apps.googleusercontent.com',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
