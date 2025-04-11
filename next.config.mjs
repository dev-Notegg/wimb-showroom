/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://dev-Notegg.github.io/wimb-showroom/"
      : "",
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required to make Konva & react-konva work
    return config;
  },
  images: {
    unoptimized: true,
  },
  output: "export",
};

export default nextConfig;
