import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";

export default function App() {
  const {
    messages,
    sendUserMessage,
    isPending,
    isError,
    error,
    attachments,
    addAttachments,
    removeAttachment,
  } = useChat();

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <section
        className="w-full flex flex-col overflow-hidden"
        style={{
          width:     "min(1000px, calc(100vw - 32px))",
          height:    "min(764px, calc(100vh - 64px))",
          minHeight: 620,
          background:   "#ffffff",
          //borderRadius: 4,
          boxShadow:    "0 22px 54px rgba(33,28,22,0.14)",
          marginTop:    25,
          border:"1px solid #00000045"
        }}
      >
        {/* Header */}
        <header
          className="px-6 py-5 shrink-0"
          style={{background: "#ffffff",marginTop:5 }}
        >
          <div className="flex items-center" style={{gap:20}}>
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
              <p className="flex items-center gap-2" style={{ fontSize: 12, marginTop: 3 }}>
                Powered by AI Chat Bot
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ChatWindow messages={messages} isPending={isPending} />

          {isError && error && (
            <p
              className="text-center text-xs mx-4 mb-2 py-2 rounded-lg shrink-0"
              style={{ color: "#b42318", background: "#fff4f2" }}
            >
              {(error).message}
            </p>
          )}

          <div
            className="px-4 pt-4 pb-4 shrink-0"
            style={{ background: "#ffffff"}}
          >
            <ChatInput
              onSend={sendUserMessage}
              onAddAttachments={addAttachments}
              onRemoveAttachment={removeAttachment}
              attachments={attachments}
              disabled={isPending}
            />
          </div>
        </main>
      </section>
    </div>
  );
}