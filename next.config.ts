import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx"],
  publicRuntimeConfig: {
    REPO_URL: process.env.REPO_URL,
    SID_ALLOWED_HOSTS: process.env.SID_ALLOWED_HOSTS,
    REPO_NAME: process.env.REPO_NAME,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    WORKING_DIR: process.env.WORKING_DIR,
    NTFY_URL: process.env.NTFY_URL,
  },
};

export default nextConfig;
