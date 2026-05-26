import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { Message } from "../types/chat";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";

interface Props {
  messages: Message[];
  isPending: boolean;
}

export default function ChatWindow({ messages, isPending }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto px-6 py-7"
      style={{
        height: "100%",
        overscrollBehavior: "contain",
        scrollbarWidth: "thin",
        scrollbarColor: "#dad4cc transparent",
      }}
    >
      {messages.length === 0 && (
        <div
          className="flex flex-col items-center justify-center h-full text-center"
          style={{ animation: "fadeUp 0.5s ease" }}
        >
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            className="w-[58px] h-[58px] rounded-[19px] flex items-center justify-center mb-4"
            style={{
              background: "#f5f3f0",
              border: "1px solid #e7e2dc",
              boxShadow: "0 10px 22px rgba(32, 26, 20, 0.06)",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <style>{`
              @keyframes float {
                0%,100% { transform: translateY(0); }
                50%      { transform: translateY(-5px); }
              }
            `}</style>
            <MessageCircle size={24} color="#8c71cc" fill="#eadfff" strokeWidth={1.7} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#070826", marginBottom: 10 }}>
              Start a conversation
            </p>
            <p style={{ fontSize: 15, maxWidth: 290, lineHeight: 1.45 }}>
              Type a message below and I'll respond
              <br />
              right away.
            </p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}

      {isPending && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
