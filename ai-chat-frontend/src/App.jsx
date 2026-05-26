import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";

export default function App() {
  const { messages, sendUserMessage, isPending, isError } = useChat();
  {isError && (
    <p className="text-center text-xs text-red-500 mb-2">
      The AI service is busy right now. Please wait a moment and try again.
    </p>
  )}
  return (
    <div
      className="min-h-screen flex items-center justify-center py-8"
    >
      <section
        className="w-full flex flex-col overflow-hidden"
        style={{
          width: "min(1000px, calc(100vw - 32px))",
          height: "min(764px, calc(100vh - 64px))",
          minHeight: 620,
          background: "#ffffff",
          border: "1px solid #e7e2dc",
          borderRadius: 4,
          boxShadow: "0 22px 54px rgba(33, 28, 22, 0.14)",
          marginTop:20
        }}
      >
        <header
          className="px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid #ebe6df", background: "#ffffff" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 30, height: 30, borderRadius: 4, background: "#17172f" }}
            >
              <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 800 }}>✦</span>
            </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#070826", lineHeight: 1.15 }}>
              AI Chat Bot
            </h1>
            <p
              className="flex items-center gap-2"
              style={{
                fontSize: 12,
                color: "#8d8884",
                marginTop: 3,
              }}
            >
              powered by AI Chat Bot
            </p>
          </div>
        </div>
      </header>

        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ChatWindow messages={messages} isPending={isPending} />

        {isError && (
          <p
            className="text-center text-xs mx-4 mb-2 py-2 rounded-lg"
            style={{
              color: "#b42318",
              background: "#fff4f2",
              border: "1px solid #ffd5cf",
            }}
          >
            Something went wrong. Please try again.
          </p>
        )}

        <div
          className="px-4 pt-4 pb-4 shrink-0"
          style={{
            background: "#ffffff",
            position: "sticky",
            bottom: 0,
            zIndex: 1,
          }}
        >
          <ChatInput onSend={sendUserMessage} disabled={isPending} />
        </div>
      </main>
      </section>
    </div>
  );
}
