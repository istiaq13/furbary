/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['res.cloudinary.com', 'images.pexels.com'],
  },
};

module.exports = nextConfig;