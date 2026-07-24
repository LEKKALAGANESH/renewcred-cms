/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The design system ships TypeScript source; Next compiles it with the app.
  transpilePackages: ['@renewcred/ui', '@renewcred/tokens', '@renewcred/schema'],
  webpack: (config) => {
    // Those packages export their `src` and use NodeNext-style imports whose `.js`
    // extension points at a `.ts` file (e.g. `./inline.js` -> `inline.ts`). Teach
    // webpack to resolve `.js` -> `.ts`/`.tsx` first so it consumes the source
    // without a prior `tsc` build — which is what lets a fresh CI clone build.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};
