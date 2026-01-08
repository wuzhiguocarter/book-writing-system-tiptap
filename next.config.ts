import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack 配置（Next.js 16 默认构建工具，无需额外配置）
  turbopack: {},

  // 启用 React Compiler（稳定版，自动优化组件性能）
  reactCompiler: true,

  // 启用 Cache Components（新的缓存模型）
  cacheComponents: true,
}

export default nextConfig
