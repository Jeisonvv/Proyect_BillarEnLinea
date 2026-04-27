import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} | Torneos, eventos y tienda de billar`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "linear-gradient(135deg, #081917 0%, #10211f 40%, #d59656 100%)",
          color: "#fff9f1",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 14% 20%, rgba(255,255,255,0.12), transparent 24%), radial-gradient(circle at 82% 18%, rgba(216,154,91,0.32), transparent 28%), linear-gradient(120deg, rgba(255,255,255,0.04), transparent 40%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                background: "rgba(255,255,255,0.06)",
              }}
            >
              B
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 20, letterSpacing: 6, textTransform: "uppercase", color: "#f3d5b1" }}>
                Billar en Linea
              </div>
              <div style={{ fontSize: 22, opacity: 0.72 }}>
                Torneos, eventos, sorteos, noticias y tienda
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 860 }}>
            <div style={{ fontSize: 86, lineHeight: 0.96, fontWeight: 600 }}>
              La nueva mesa para competir, descubrir y vender con identidad.
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.35, color: "rgba(255,249,241,0.82)", maxWidth: 760 }}>
              Una portada profesional para mostrar agenda activa, actualidad del billar y una tienda especializada con relevancia de marca.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              "Torneos activos",
              "Eventos destacados",
              "Noticias relevantes",
              "Tienda especializada",
            ].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  padding: "14px 22px",
                  fontSize: 22,
                  color: "rgba(255,249,241,0.78)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}