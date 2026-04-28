import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        background: "linear-gradient(135deg, rgb(15, 23, 42), rgb(30, 41, 59))",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: "999px",
          color: "rgba(255, 255, 255, 0.82)",
          display: "flex",
          fontSize: 28,
          padding: "12px 24px",
        }}
      >
        Lynote Toolkit
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "860px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.08 }}>
          开发者在线工具箱
        </div>
        <div
          style={{
            color: "rgba(255, 255, 255, 0.82)",
            display: "flex",
            fontSize: 30,
            lineHeight: 1.4,
          }}
        >
          JSON 格式化、密钥生成、哈希与 HMAC、RSA 联调，全部在浏览器本地完成。
        </div>
      </div>
    </div>,
    size,
  );
}
