const nextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wasgeurtje.nl',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
