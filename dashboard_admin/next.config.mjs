import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Removido output: 'export' para permitir APIs no Vercel
  // Removido trailingSlash: true
  // Removido distDir: 'out'
  serverExternalPackages: ['firebase-admin']
}

export default nextConfig
