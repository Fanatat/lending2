export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 card used by both app/opengraph-image.tsx and app/twitter-image.tsx. */
export function OgImageCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0a0a0a",
        color: "#e8e8e8",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: 22,
          letterSpacing: 4,
          color: "#7a7a7a",
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#3ddc6a",
          }}
        />
        vanatat.vercel.app
      </div>
      <div style={{ display: "flex", fontSize: 88, marginTop: 28, lineHeight: 1.05 }}>
        Привет от Валеры
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 32,
          fontSize: 40,
          color: "#ffc53d",
        }}
      >
        9 систем · 2 000 ₽/мес
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 40,
          fontSize: 26,
          color: "#7a7a7a",
          maxWidth: 900,
        }}
      >
        Ноль сотрудников. Ноль облачных подписок. Ноль обещаний.
      </div>
    </div>
  );
}
