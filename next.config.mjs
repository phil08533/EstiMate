/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow canvas in Konva to work with Next.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Konva uses canvas — stub it server-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }
    return config
  },
  // Image domains for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

export default nextConfig
