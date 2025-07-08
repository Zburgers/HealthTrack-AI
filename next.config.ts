import type {NextConfig} from 'next';
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Optimize for Electron packaging
  reactStrictMode: false, // Disable in development to prevent double useEffect calls
  
  // Electron-specific optimizations
  ...(process.env.ELECTRON_ENV && {
    trailingSlash: true,
    // Remove assetPrefix for development to avoid routing issues
    // assetPrefix: './', // Commented out - causes 404s on navigation
    distDir: '.next',
  }),
  
  typescript: {
    // Set to false for production builds to enforce type checking
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Set to false for production builds to enforce linting rules
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
