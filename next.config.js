/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://backend-fv2smk2ji-sway-dev.vercel.app'
      : 'http://localhost:5001'

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig