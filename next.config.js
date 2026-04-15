/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Unsplash — dummy/seed product images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      // Cloudinary — admin uploaded product images
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Generic HTTPS catch-all for any other remote image sources
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
