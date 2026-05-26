export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
     
      {/* Avatar */}
      <div
        className="w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          background: "#17172f",
          color: "#ffffff",
          boxShadow: "0 8px 16px rgba(23,23,47,0.18)",
        }}
      >
        ✦
      </div>

      {/* Dots bubble */}
      <div
        style={{
          background: "#f8f7f5",
          border: "1px solid #e6e1da",
          borderRadius: "16px 16px 16px 4px",
          padding: "12px 16px",
          boxShadow: "0 8px 18px rgba(32,26,20,0.05)",
        }}
      >
        <div className="flex gap-1 items-center" style={{ height: 16 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#8c71cc",
                display: "inline-block",
                animation: "dotBounce 0.9s ease infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}