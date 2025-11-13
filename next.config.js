/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // sqlite3 فقط برای سمت سرور است و نباید در کلاینت باندل شود
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sqlite3': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

