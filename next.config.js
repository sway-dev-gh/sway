/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED PROXY REWRITES - Using direct API calls to fix CORS issues
  // The Vercel proxy was interfering with CORS headers
  // All API calls now go directly to api.swayfiles.com with proper CORS
}

module.exports = nextConfig