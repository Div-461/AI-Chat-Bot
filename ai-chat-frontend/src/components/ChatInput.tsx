import { useState, useRef, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div>
      <div
        className="flex items-end gap-3 px-5 py-2 transition-all"
        style={{
          minHeight: 62,
          background: "#f8f7f5",
          border: `1px solid ${canSend ? "#d8d2cc" : "#e6e1da"}`,
          borderRadius: 16,
          boxShadow: canSend ? "0 0 0 3px rgba(23, 23, 47, 0.05)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            resize: "none",
            outline: "none",
            fontSize: 16,
            color: "#17172f",
            background: "transparent",
            maxHeight: 160,
            lineHeight: 1.5,
            paddingTop: 10,
            paddingBottom: 10,
          }}
          className={clsx("placeholder:text-[#9c9690]", disabled && "opacity-40 cursor-not-allowed")}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all"
          style={
            canSend
              ? {
                  background: "#17172f",
                  color: "#ffffff",
                  boxShadow: "0 10px 18px rgba(23, 23, 47, 0.2)",
                  transform: "scale(1)",
                }
              : { background: "#17172f", color: "#ffffff", cursor: "not-allowed" }
          }
          onMouseEnter={(e) => { if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          <SendHorizontal size={20} strokeWidth={2.1} />
        </button>
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "#9b958f",
          marginTop: 8,
        }}
      >
        <kbd
          style={{
            background: "#f8f7f5",
            border: "1px solid #e1dbd4",
            borderRadius: 4,
            padding: "1px 7px",
            fontSize: 10,
            color: "#9b958f",
          }}
        >
          Enter
        </kbd>{" "}
        send&nbsp;&nbsp;·&nbsp;&nbsp;
        <kbd
          style={{
            background: "#f8f7f5",
            border: "1px solid #e1dbd4",
            borderRadius: 4,
            padding: "1px 7px",
            fontSize: 10,
            color: "#9b958f",
          }}
        >
          Shift+Enter
        </kbd>{" "}
        new line
      </p>
    </div>
  );
}