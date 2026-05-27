import { useState, useEffect, useCallback } from "react";
import { getAllSessions, deleteSession, type SessionRecord } from "../utils/db";

export function useChatSessions(
  activeSessionId: string | null,
  userId: string | null          // ← new
) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    getAllSessions(userId)          // ← pass userId
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [userId]);                    // ← re-run when user changes

  const refreshSessions = useCallback(async () => {
    if (!userId) return;
    const updated = await getAllSessions(userId);
    setSessions(updated);
  }, [userId]);

  const removeSession = useCallback(async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, loading, refreshSessions, removeSession };
}