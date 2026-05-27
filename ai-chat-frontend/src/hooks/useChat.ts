import { useState, useEffect, useCallback } from "react";
import { sendMessage } from "../api/chatApi";
import type { Attachment, Message } from "../types/chat";
import { fileToBase64 } from "../utils/fileUtils";
import {
  createSession,
  saveMessage,
  getMessages,
  updateSession,
} from "../utils/db";

const newId = () => crypto.randomUUID();
const MAX_HISTORY_MESSAGES = 20;

function toMessageAttachment({ id, name, mimeType, size }: Attachment): Attachment {
  return { id, name, mimeType, size };
}

async function serializeAttachments(attachments: Attachment[]) {
  const serialized = [];

  for (const attachment of attachments) {
    if (!attachment.file) continue;

    serialized.push({
      name: attachment.name,
      mimeType: attachment.mimeType,
      base64: await fileToBase64(attachment.file),
    });
  }

  return serialized;
}


export function useChat({ onSessionCreated,userId }: {onSessionCreated?: () => void;
  userId: string | null; }) {
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setAttachments([]);
  }, [userId]);

  // ── Load an existing session from IndexedDB ──────────────────
  const loadSession = useCallback(async (id: string) => {
    setIsLoadingSession(true);
    setMessages([]);

    const stored = await getMessages(id);
    const loaded: Message[] = stored.map((m) => ({
      id:        m.id,
      role:      m.role,
      content:   m.content,
      timestamp: new Date(m.timestamp),
    }));

    setSessionId(id);
    setMessages(loaded);
    setIsLoadingSession(false);
  }, []);

  // ── Start a brand new empty chat ─────────────────────────────
  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setAttachments([]);
  }, []);

  // ── Send a message ────────────────────────────────────────────
  const sendUserMessage = useCallback(
    async (content: string) => {
      if ((!content.trim() && attachments.length === 0) || isPending) return;
      // Create a new session on the very first message
      let activeSessionId = sessionId;
      const trimmedContent = content.trim();
      const pendingAttachments = attachments;
      const history = messages
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content }));

      if (userId && !activeSessionId) {
        activeSessionId = newId();
        await createSession(activeSessionId, trimmedContent || "Attachment", userId);
        setSessionId(activeSessionId);
        onSessionCreated?.(); // refresh sidebar immediately
      }

      const userMsg: Message = {
        id:          newId(),
        role:        "user",
        content:     trimmedContent,
        timestamp:   new Date(),
        attachments: pendingAttachments.length > 0
          ? pendingAttachments.map(toMessageAttachment)
          : undefined,
      };

      setMessages((prev) => [...prev, userMsg]);
      setAttachments([]);
      setError(null);
      setIsPending(true);

      // Persist user message to IndexedDB
      if (activeSessionId) {
        await saveMessage({
          id:        userMsg.id,
          sessionId: activeSessionId,
          role:      "user",
          content:   userMsg.content,
          timestamp: userMsg.timestamp.getTime(),
        });
      }

      try {
        const serializedAttachments = await serializeAttachments(pendingAttachments);
        const data = await sendMessage({
          message: trimmedContent,
          history,
          attachments: serializedAttachments.length > 0
            ? serializedAttachments
            : undefined,
          sessionId: activeSessionId ?? undefined,
        });

        const assistantMsg: Message = {
          id:        newId(),
          role:      "assistant",
          content:   data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (activeSessionId) {
          await saveMessage({
            id:        assistantMsg.id,
            sessionId: activeSessionId,
            role:      "assistant",
            content:   assistantMsg.content,
            timestamp: assistantMsg.timestamp.getTime(),
          });

          await updateSession(activeSessionId, data.reply);
          onSessionCreated?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Something went wrong."));
      } finally {
        setIsPending(false);
      }
    },
    [sessionId, messages, attachments, isPending, onSessionCreated, userId]
  );

  // ── Attachment helpers (unchanged) ───────────────────────────
  const addAttachments = useCallback((incoming: Attachment[]) => {
    setAttachments((prev) => [...prev, ...incoming].slice(0, 5));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    sessionId,
    messages,
    sendUserMessage,
    isPending,
    isError: Boolean(error),
    error,
    attachments,
    addAttachments,
    removeAttachment,
    loadSession,
    startNewChat,
    isLoadingSession,
  };
}
