/**
 * Semua permintaan /api/* diteruskan ke backend PHP, sehingga browser hanya bicara ke satu alamat
 * (cookie sesi tetap same-origin, tidak perlu CORS).
 * Atur alamat backend lewat BACKEND_URL di .env.local (lihat .env.example).
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost/zamheal-clinic/api/index.php").replace(/\/$/, "")

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }]
  },
}

export default nextConfig
