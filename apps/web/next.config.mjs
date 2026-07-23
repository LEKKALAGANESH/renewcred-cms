/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The design system ships TypeScript source; Next compiles it with the app.
  transpilePackages: ['@renewcred/ui', '@renewcred/tokens', '@renewcred/schema'],
};
