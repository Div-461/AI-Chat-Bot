import "../css/TypingIndicator.css";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
     
      {/* Avatar */}
      <div
        className="typing-indicator-avatar w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold"
      >
        ✦
      </div>

      {/* Dots bubble */}
      <div
        className="typing-indicator-bubble"
      >
        <div className="typing-indicator-dots flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-indicator-dot"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
