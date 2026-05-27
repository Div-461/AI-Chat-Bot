import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { Message } from "../types/chat";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";
import "../css/ChatWindow.css";

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
      className="chat-window flex-1 min-h-0 overflow-y-auto px-6 py-7"
    >
      {messages.length === 0 && (
        <div
          className="chat-window-empty flex flex-col items-center justify-center h-full text-center"
        >
          <div
            className="chat-window-empty-icon w-[58px] h-[58px] rounded-[19px] flex items-center justify-center mb-4"
          >
            <MessageCircle size={24} color="#8c71cc" fill="#eadfff" strokeWidth={1.7} />
          </div>
          <div>
            <p className="chat-window-empty-title">
              Start a conversation
            </p>
            <p className="chat-window-empty-copy">
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
