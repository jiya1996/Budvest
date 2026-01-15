/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 开发模式禁用
  runtimeCaching: [
    {
      // 缓存 API 请求（股票数据等）
      urlPattern: /^https?:\/\/.*\/api\/market\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'market-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 分钟
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // 缓存静态资源
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
        },
      },
    },
    {
      // 缓存字体
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 年
        },
      },
    },
    {
      // 缓存 JS/CSS
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 天
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline', // 离线时显示的页面
  },
});

const nextConfig = {
  reactStrictMode: true,

  // 排除原生模块（better-sqlite3 需要编译）
  serverExternalPackages: ['better-sqlite3'],

  // Webpack 配置
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 服务端排除 better-sqlite3
      config.externals = config.externals || [];
      config.externals.push('better-sqlite3');
    }
    return config;
  },

  // PWA manifest 配置
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_NAME: '伴投 Investbuddy',
    NEXT_PUBLIC_APP_VERSION: '0.2.0',
  },

  // 图片域名白名单（如果需要外部图片）
  images: {
    domains: ['logo.clearbit.com'],
  },
};

module.exports = withPWA(nextConfig);
