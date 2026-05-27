import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "../api/chatApi";
import type { Attachment, Message } from "../types/chat";
import {
  createSession,
  saveMessage,
  getMessages,
  updateSession,
} from "../utils/db";

const newId = () => crypto.randomUUID();


export function useChat({ onSessionCreated,userId }: {onSessionCreated?: () => void;
  userId: string | null; }) {
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

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

  // ── Mutation ─────────────────────────────────────────────────
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: sendMessage,
    onSuccess: async (data, variables) => {
      const assistantMsg: Message = {
        id:        newId(),
        role:      "assistant",
        content:   data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Persist assistant message to IndexedDB
      if (variables.sessionId) {
        await saveMessage({
          id:        assistantMsg.id,
          sessionId: variables.sessionId,
          role:      "assistant",
          content:   assistantMsg.content,
          timestamp: assistantMsg.timestamp.getTime(),
        });

        // Update session preview with the AI reply
        await updateSession(variables.sessionId, data.reply);

        // Refresh sidebar
        onSessionCreated?.();
      }
    },
  });

  // ── Send a message ────────────────────────────────────────────
  const sendUserMessage = useCallback(
    async (content: string) => {
      if (!content.trim() && attachments.length === 0) return;
      // Create a new session on the very first message
      let activeSessionId = sessionId;

      if (userId && !activeSessionId) {
        activeSessionId = newId();
        await createSession(activeSessionId, content.trim(),userId);
        setSessionId(activeSessionId);
        onSessionCreated?.(); // refresh sidebar immediately
      }

      const userMsg: Message = {
        id:          newId(),
        role:        "user",
        content:     content.trim(),
        timestamp:   new Date(),
        attachments: attachments.length > 0 ? [...attachments] : undefined,
      };

      setMessages((prev) => [...prev, userMsg]);

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

      mutate({
        message:     content.trim(),
        history:     messages.map(({ role, content }) => ({ role, content })),
        attachments: attachments.map(({ name, mimeType, base64 }) => ({
          name,
          mimeType,
          base64,
        })),
        sessionId: activeSessionId ?? undefined,
      });

      setAttachments([]);
    },
    [sessionId, messages, attachments, mutate, onSessionCreated,userId]
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
    isError,
    error,
    attachments,
    addAttachments,
    removeAttachment,
    loadSession,
    startNewChat,
    isLoadingSession,
  };
}
