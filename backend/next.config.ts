import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@grok-hack/api-contract'],
};

export default nextConfig;
