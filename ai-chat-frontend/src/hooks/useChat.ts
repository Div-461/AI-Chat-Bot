import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "../api/chatApi";
import type { Attachment, Message } from "../types/chat";

const newId = () => crypto.randomUUID();

export function useChat() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id:        newId(),
          role:      "assistant",
          content:   data.reply,
          timestamp: new Date(),
        },
      ]);
    },
  });

  // Called by ChatInput when the user picks files
  const addAttachments = useCallback((incoming: Attachment[]) => {
    setAttachments((prev) => {
      const combined = [...prev, ...incoming];
      return combined.slice(0, 5); // hard cap at 5
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => setAttachments([]), []);

  const sendUserMessage = useCallback(
    (content: string) => {
      if (!content.trim() && attachments.length === 0) return;

      const userMessage: Message = {
        id:          newId(),
        role:        "user",
        content:     content.trim(),
        timestamp:   new Date(),
        attachments: attachments.length > 0 ? [...attachments] : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);

      mutate({
        message:     content.trim(),
        history:     messages.map(({ role, content }) => ({ role, content })),
        attachments: attachments.map(({ name, mimeType, base64 }) => ({
          name,
          mimeType,
          base64,
        })),
      });

      // Clear attachments after sending
      clearAttachments();
    },
    [messages, attachments, mutate, clearAttachments]
  );

  return {
    messages,
    sendUserMessage,
    isPending,
    isError,
    error,
    attachments,
    addAttachments,
    removeAttachment,
  };
}