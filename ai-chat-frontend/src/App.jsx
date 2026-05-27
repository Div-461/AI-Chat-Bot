import { useCallback } from "react";
import { useChat } from "./hooks/useChat";
import { useChatSessions } from "./hooks/useChatSessions";
import { useAuth } from "./components/AuthContext";
import ChatHistory from "./components/ChatHistory";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import "./css/App.css";

export default function App() {
  const { user } = useAuth();
  const userId = user?.sub ?? null;

  const {
    sessionId,
    messages,
    sendUserMessage,
    isPending,
    isError,
    error,
    attachments,
    addAttachments,
    removeAttachment,
    loadSession,
    startNewChat,
    isLoadingSession,
  } = useChat({
    onSessionCreated: () => refreshSessions(), // keep sidebar in sync
    userId,
  });

  const { sessions, loading, refreshSessions, removeSession } =
    useChatSessions(sessionId, userId);

  const handleSelectSession = useCallback(async (id) => {
    if (id === sessionId) return; // already open
    await loadSession(id);
  }, [loadSession, sessionId]);

  const handleNewChat = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  const handleDeleteSession = useCallback(async (id) => {
    await removeSession(id);
    // If we deleted the active session, start a fresh one
    if (id === sessionId) startNewChat();
  }, [removeSession, sessionId, startNewChat]);

  return (
    <div className="min-h-screen flex items-center justify-center gap-4 py-8 px-4">
      <ChatHistory
        sessions={sessions}
        loading={loading}
        activeSessionId={sessionId}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        onDelete={handleDeleteSession}
      />

      <section
        className="app-shell w-full flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header
          className="app-header px-6 py-5 shrink-0"
        >
          <div className="app-title-row flex items-center">
            <div
              className="app-logo flex items-center justify-center shrink-0"
            >
              <span className="app-logo-mark">✦</span>
            </div>
            <div>
              <h1 className="app-title">
                AI Chat Bot
              </h1>
              <p className="app-subtitle flex items-center gap-2">
                Powered by AI Chat Bot
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">

          {/* Loading overlay when switching sessions */}
          {isLoadingSession ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="app-loading-message">Loading conversation…</p>
            </div>
          ) : (
            <ChatWindow messages={messages} isPending={isPending} />
          )}

          {isError && error && (
            <p
              className="app-error text-center text-xs mx-4 mb-2 py-2 rounded-lg shrink-0"
            >
              {(error).message}
            </p>
          )}

          <div
            className="app-input-area px-4 pt-4 pb-4 shrink-0"
          >
            <ChatInput
              onSend={sendUserMessage}
              onAddAttachments={addAttachments}
              onRemoveAttachment={removeAttachment}
              attachments={attachments}
              disabled={isPending || isLoadingSession}
            />
          </div>
        </main>
      </section>
    </div>
  );
}
