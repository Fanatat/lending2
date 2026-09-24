/**
 * Two targets from one codebase:
 * - Vercel (default): regular Next.js build.
 * - GitHub Pages (PAGES_BASE_PATH set by the workflow): fully static export
 *   served from a sub-path like /lending2. vercel.app is unreachable from
 *   part of Russian networks, github.io isn't.
 */
const pagesBasePath = process.env.PAGES_BASE_PATH;
const isPages = pagesBasePath !== undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isPages && {
    output: "export",
    basePath: pagesBasePath,
    trailingSlash: true,
    images: { unoptimized: true },
    env: {
      NEXT_PUBLIC_BASE_PATH: pagesBasePath,
      NEXT_PUBLIC_SITE_URL: process.env.PAGES_SITE_URL,
    },
  }),
};

export default nextConfig;
