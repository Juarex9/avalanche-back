import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@avalabs/eerc-sdk"],
  webpack: (config, { isServer, webpack }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        },
      ),
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      };
    }

    return config;
  },
};

export default nextConfig;
