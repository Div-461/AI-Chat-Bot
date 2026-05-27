// ── Database schema ────────────────────────────────────────────
// DB name:    AiChatDB
// Version:    3
// Stores:
//   sessions  → { id, title, preview, createdAt, updatedAt }
//   messages  → { id, sessionId, role, content, timestamp }
//              index on sessionId for fast per-session queries

const DB_NAME    = "AiChatDB";
const DB_VERSION = 3;
let dbPromise: Promise<IDBDatabase> | null = null;

export interface SessionRecord {
  id:        string;
  userId:    string;
  title:     string;
  preview:   string;   // last message snippet shown in sidebar
  createdAt: number;   // Date.now()
  updatedAt: number;
}

export interface MessageRecord {
  id:        string;
  sessionId: string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: number;
}

// ── Open (or create) the database ─────────────────────────────
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("sessions")) {
        const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
        sessionStore.createIndex("updatedAt", "updatedAt");
        sessionStore.createIndex("userId", "userId");
        sessionStore.createIndex("userUpdatedAt", ["userId", "updatedAt"]);
      }

      if (!db.objectStoreNames.contains("messages")) {
        const messageStore = db.createObjectStore("messages", { keyPath: "id" });
        messageStore.createIndex("sessionId", "sessionId");
      }

      if (db.objectStoreNames.contains("sessions")) {
        const tx    = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore("sessions");
        if (!store.indexNames.contains("userId")) {
          store.createIndex("userId", "userId");
        }
        if (!store.indexNames.contains("userUpdatedAt")) {
          store.createIndex("userUpdatedAt", ["userId", "updatedAt"]);
        }
      }
    };

    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = (e) => {
      dbPromise = null;
      reject((e.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// ── Generic helpers ────────────────────────────────────────────
function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(new Error("Transaction aborted"));
  });
}

// ── Sessions ───────────────────────────────────────────────────

// Create a brand new empty session
export async function createSession(id: string, firstMessage: string,userId: string): Promise<SessionRecord> {
  const db = await openDB();

  const session: SessionRecord = {
    id,
    userId,
    title:     firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : ""),
    preview:   firstMessage.slice(0, 80) + (firstMessage.length > 80 ? "…" : ""),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const tx    = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  store.put(session);
  await promisifyTransaction(tx);
  return session;
}

// Update session preview + updatedAt after each message
export async function updateSession(
  id:      string,
  preview: string
): Promise<void> {
  const db      = await openDB();
  const tx      = db.transaction("sessions", "readwrite");
  const store   = tx.objectStore("sessions");
  const existing = await promisifyRequest<SessionRecord>(store.get(id));

  if (!existing) return;

  store.put({
    ...existing,
    preview:   preview.slice(0, 80) + (preview.length > 80 ? "…" : ""),
    updatedAt: Date.now(),
  });

  await promisifyTransaction(tx);
}

// Get all sessions sorted newest first (for the sidebar)
export async function getAllSessions(userId: string): Promise<SessionRecord[]> {
  const db      = await openDB();
  const tx      = db.transaction("sessions", "readonly");
  const store   = tx.objectStore("sessions");
  const index   = store.index("userUpdatedAt");
  const req     = index.getAll(IDBKeyRange.bound([userId, 0], [userId, Infinity]));
  const results = await promisifyRequest<SessionRecord[]>(req);

  return results.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Delete a session and all its messages
export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();

  // Delete the session record
  const sessionTx = db.transaction("sessions", "readwrite");
  sessionTx.objectStore("sessions").delete(id);
  await promisifyTransaction(sessionTx);

  // Delete all messages belonging to this session
  const msgTx   = db.transaction("messages", "readwrite");
  const store   = msgTx.objectStore("messages");
  const index   = store.index("sessionId");
  const keys    = await promisifyRequest<IDBValidKey[]>(
    index.getAllKeys(IDBKeyRange.only(id))
  );
  for (const key of keys) store.delete(key);
  await promisifyTransaction(msgTx);
}

// ── Messages ───────────────────────────────────────────────────

// Save a single message
export async function saveMessage(msg: MessageRecord): Promise<void> {
  const db    = await openDB();
  const tx    = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  store.put(msg);
  await promisifyTransaction(tx);
}

// Get all messages for a session, sorted oldest first
export async function getMessages(sessionId: string): Promise<MessageRecord[]> {
  const db    = await openDB();
  const tx    = db.transaction("messages", "readonly");
  const store = tx.objectStore("messages");
  const index = store.index("sessionId");

  const results = await promisifyRequest<MessageRecord[]>(
    index.getAll(IDBKeyRange.only(sessionId))
  );

  // Sort ascending — oldest first (natural chat order)
  return results.sort((a, b) => a.timestamp - b.timestamp);
}

// Delete all messages for a session (used by deleteSession)
export async function clearMessages(sessionId: string): Promise<void> {
  const db    = await openDB();
  const tx    = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  const index = store.index("sessionId");
  const keys  = await promisifyRequest<IDBValidKey[]>(
    index.getAllKeys(IDBKeyRange.only(sessionId))
  );
  for (const key of keys) store.delete(key);
  await promisifyTransaction(tx);
}
