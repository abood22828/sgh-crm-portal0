/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the new app directory
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['mysql2', 'jose', 'bcryptjs'],
  },
  // Set the source directory to the root for Next.js to find the 'app' folder
  // This is important because the project structure is not standard
  // reactStrictMode: true,
  // swcMinify: true,
  // output: 'standalone', // For Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
