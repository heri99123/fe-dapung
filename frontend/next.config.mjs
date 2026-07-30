/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Hilangkan konfigurasi yang sudah deprecated
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,

  // HAPUS swcMinify & experimental.optimizeCss
  // karena tidak didukung lagi di Next.js 15
  experimental: {
    optimizeCss: false,
  },

  output: "standalone",

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: "commons",
            chunks: "all",
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: "lib",
            chunks: "all",
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
