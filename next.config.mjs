/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

// PWA will work with manifest.json and the install prompt component
// To enable full PWA features with service worker, install next-pwa:
// npm install next-pwa
// Then uncomment the code below:
//
// import withPWA from 'next-pwa';
// const config = withPWA({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   skipWaiting: true,
//   sw: 'sw.js',
// })(nextConfig);
// export default config;

export default nextConfig;
