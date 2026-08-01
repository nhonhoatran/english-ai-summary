import type { NextConfig } from "next";

// No `output: "standalone"`: the app runs through the custom server.js
// (Next.js handler + Socket.io), which resolves `next` from node_modules.
const nextConfig: NextConfig = {};

export default nextConfig;
