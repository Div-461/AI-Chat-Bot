import { lazy, memo, Suspense, useCallback, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, History, MessageSquareText, Plus, Trash2, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import clsx from "clsx";
import type { SessionRecord } from "../utils/db";
import "../css/ChatHistory.css";

const GoogleSignIn = lazy(() => import("./GoogleSignIn"));

interface Props {
  sessions:        SessionRecord[];
  loading:         boolean;
  activeSessionId: string | null;
  onSelect:        (id: string) => void;
  onNewChat:       () => void;
  onDelete:        (id: string) => void;
}

function formatTime(ts: number): string {
  const now   = new Date();
  const date  = new Date(ts);
  const diff  = now.getDate() - date.getDate();
  const sameYear  = now.getFullYear() === date.getFullYear();
  const sameMonth = now.getMonth()    === date.getMonth();

  if (sameMonth && diff === 0) return "Today";
  if (sameMonth && diff === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: sameYear ? "short" : undefined,
    month:   "short",
    day:     "numeric",
  });
}

interface SessionRowProps {
  item: SessionRecord;
  isActive: boolean;
  confirmDelete: boolean;
  onSelect: (id: string) => void;
  onDeleteClick: (e: MouseEvent, id: string) => void;
  onConfirmDelete: (e: MouseEvent, id: string) => void;
  onCancelDelete: (e: MouseEvent) => void;
}

const SessionRow = memo(function SessionRow({
  item,
  isActive,
  confirmDelete,
  onSelect,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: SessionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={clsx(
        "chat-history-item mb-2 flex w-full items-start text-left transition-colors",
        isActive && "chat-history-item-active"
      )}
    >
      <span className="chat-history-item-icon flex shrink-0 items-center justify-center">
        <MessageSquareText size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="chat-history-item-title block truncate">{item.title}</span>
        <span className="chat-history-item-preview mt-1 block truncate">{item.preview}</span>
        <span className="chat-history-item-time mt-2 block">{formatTime(item.updatedAt)}</span>
      </span>

      {!confirmDelete && (
        <span
          role="button"
          onClick={(e) => onDeleteClick(e, item.id)}
          className="chat-history-delete flex items-center justify-center ml-1 shrink-0"
          title="Delete conversation"
        >
          <Trash2 size={13} />
        </span>
      )}

      {confirmDelete && (
        <span className="flex gap-1 ml-1 shrink-0 items-center">
          <span
            role="button"
            onClick={(e) => onConfirmDelete(e, item.id)}
            className="chat-history-confirm-delete text-xs px-1.5 py-0.5 rounded"
            title="Confirm delete"
          >
            Delete
          </span>
          <span
            role="button"
            onClick={onCancelDelete}
            className="chat-history-cancel-delete text-xs px-1.5 py-0.5 rounded"
            title="Cancel"
          >
            Cancel
          </span>
        </span>
      )}
    </button>
  );
});

export default function ChatHistory({
  sessions,
  loading,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
}: Props) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen]               = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = useCallback((e: MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDelete(id);
  }, []);

  const confirmDeletion = useCallback((e: MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
    setConfirmDelete(null);
  }, [onDelete]);

  const cancelDelete = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(null);
  }, []);

  return (
    <aside
      className={clsx(
        "chat-history shrink-0 overflow-hidden transition-all duration-300",
        isOpen ? "chat-history-open" : "chat-history-closed"
      )}
      aria-label="Chat history"
    >
      <div className="flex h-full min-h-0 flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="chat-history-header flex shrink-0 items-center px-4 py-5">
          <button
            type="button"
            onClick={() => setIsOpen((c) => !c)}
            aria-label={isOpen ? "Collapse chat history" : "Expand chat history"}
            className="chat-history-toggle flex shrink-0 items-center justify-center transition-colors"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          {isOpen && (
            <div className="min-w-0 flex-1">
              <div className="chat-history-title-row flex items-center">
                <History size={17} color="#17172f" />
                <h2 className="chat-history-title">Chat History</h2>
              </div>
              <p className="chat-history-subtitle">Recent conversations</p>
            </div>
          )}

          {isOpen && (
            <button
              type="button"
              onClick={onNewChat}
              aria-label="New chat"
              title="New chat"
              className="chat-history-toggle flex items-center justify-center transition-colors ml-1"
            >
              <Plus size={17} />
            </button>
          )}
        </header>

        {/* ── Session list ───────────────────────────────────── */}
        {isOpen && (
          <div className="chat-history-list flex-1 min-h-0 overflow-y-auto px-3 py-3">

            {loading && (
              <p className="chat-history-subtitle text-center py-4">Loading…</p>
            )}

            {!loading && !user && (
              <p className="chat-history-subtitle text-center py-6">
                Sign in to save your conversations.
                <br />Guest chats stay only for this session.
              </p>
            )}

            {!loading && user && sessions.length === 0 && (
              <p className="chat-history-subtitle text-center py-6">
                No conversations yet.
                <br />Start chatting to save history.
              </p>
            )}

            {sessions.map((item) => (
              <SessionRow
                key={item.id}
                item={item}
                isActive={activeSessionId === item.id}
                confirmDelete={confirmDelete === item.id}
                onSelect={onSelect}
                onDeleteClick={handleDelete}
                onConfirmDelete={confirmDeletion}
                onCancelDelete={cancelDelete}
              />
            ))}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        {isOpen && (
          <div className="chat-history-footer shrink-0">
            {user ? (
              // ── Logged in: avatar + name + logout button ────
              <div className="chat-history-user flex items-center gap-3 px-4 py-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="chat-history-avatar"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="chat-history-user-name truncate">{user.name}</p>
                  <p className="chat-history-user-email truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="chat-history-logout flex items-center justify-center"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="chat-history-google-login">
                <Suspense fallback={null}>
                  <GoogleSignIn className="chat-history-google-button flex w-full items-center justify-center transition-colors" />
                </Suspense>
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
