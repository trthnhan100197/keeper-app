import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép truy cập dev server (HMR, webpack assets) khi mở app qua IP LAN thay vì localhost
  // (test trên điện thoại cùng mạng wifi). Không có dòng này thì các resource dev bị chặn cross-origin.
  allowedDevOrigins: ["10.182.20.162"],
  experimental: {
    serverActions: {
      // Cho phép gọi Server Actions khi mở app qua IP LAN. Next.js mặc định chỉ chấp nhận request
      // cùng origin với host — mở bằng IP thay vì localhost sẽ bị chặn (âm thầm, không lỗi rõ ràng)
      // nếu không khai báo ở đây.
      allowedOrigins: ["10.182.20.162:3000"],
    },
  },
};

export default nextConfig;
