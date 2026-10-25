import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false, // ISR indicator disable 
    buildActivity: false, // Build activity indicator disable 
  },
};

export default nextConfig;