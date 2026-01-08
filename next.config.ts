/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 实验性功能：启用 App Router
  experimental: {
    // 如需启用服务器组件，可以在这里配置
  },

  // Webpack 配置
  webpack: (config: any) => {
    // 处理 Dexie 和 IndexedDB
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
