/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude experimental web directory from build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configure webpack to exclude web directory
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    // Exclude experimental web directory files
    config.module.rules.push({
      test: /web\/.*\.(tsx?|jsx?)$/,
      use: 'null-loader'
    })
    return config
  },
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.swayfiles.com'
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