/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiTarget = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiTarget}/auth/:path*`,
      },
    ]
  },
}

export default nextConfig
