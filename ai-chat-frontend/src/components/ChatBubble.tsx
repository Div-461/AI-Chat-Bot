import clsx from "clsx";
import { useState } from "react";
import { Check, Copy, FileText, Image, File } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types/chat";
import { getFileLabel } from "../utils/fileUtils";

interface Props {
  message: Message;
}

function AttachmentBadge({ name, mimeType }: { name: string; mimeType: string }) {
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs mb-2 mr-1"
      style={{
        background: "rgba(255,255,255,0.12)",
        border:     "1px solid rgba(255,255,255,0.18)",
        color:      "inherit",
        maxWidth:   180,
      }}
      title={name}
    >
      {isImage ? <Image size={11} /> : isPdf ? <FileText size={11} /> : <File size={11} />}
      <span
        style={{
          maxWidth:     130,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
        }}
      >
        {name}
      </span>
      <span style={{ opacity: 0.65, flexShrink: 0 }}>
        {getFileLabel(mimeType)}
      </span>
    </div>
  );
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const getCopyText = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCopyText(message.content));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const hasAttachments = (message.attachments?.length ?? 0) > 0;

  return (
    <div
      className={clsx("flex items-end gap-2 mb-3", isUser ? "flex-row-reverse" : "flex-row")}
      style={{ animation: "bubbleIn 0.22s cubic-bezier(0.22,1,0.36,1)" }}
    >
      <style>{`
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .md-content p                { margin: 0 0 8px; }
        .md-content p:last-child     { margin-bottom: 0; }
        .md-content strong           { font-weight: 600; }
        .md-content em               { font-style: italic; }
        .md-content ul,
        .md-content ol               { margin: 6px 0 8px 16px; padding: 0; }
        .md-content li               { margin-bottom: 3px; }
        .md-content code             { font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.08); padding: 1px 5px; border-radius: 4px; }
        .md-content pre              { background: rgba(0,0,0,0.08); padding: 10px 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
        .md-content pre code         { background: none; padding: 0; }
        .md-content h1, .md-content h2, .md-content h3 { font-weight: 600; margin: 10px 0 4px; }
        .md-content h1               { font-size: 15px; }
        .md-content h2               { font-size: 14px; }
        .md-content h3               { font-size: 13px; }
        .md-content a                { text-decoration: underline; opacity: 0.85; }
        .md-content blockquote       { border-left: 3px solid rgba(0,0,0,0.15); margin: 6px 0; padding-left: 10px; opacity: 0.8; }
      `}</style>

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={
          isUser
            ? { background: "#f0ede9", color: "#6f6760",borderRadius:4 }
            : { background: "#17172f", color: "#ffffff", boxShadow: "0 8px 16px rgba(23,23,47,0.18)",borderRadius:4 }
        }
      >
        {isUser ? "U" : "✦"}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          "group relative max-w-[72%] px-4 py-3 pr-11 text-sm leading-relaxed",
          isUser ? "whitespace-pre-wrap" : "md-content"
        )}
        style={
          isUser
            ? { background: "#17172f", color: "#ffffff" }
            : { background: "#f8f7f5", color: "#28243d", border: "1px solid #e6e1da", boxShadow: "0 8px 18px rgba(32,26,20,0.05)" }
        }
      >
        {/* Attachment badges — only on user messages */}
        {isUser && hasAttachments && (
          <div className="flex flex-wrap mb-2">
            {message.attachments!.map((att) => (
              <AttachmentBadge
                key={att.id}
                name={att.name}
                mimeType={att.mimeType}
              />
            ))}
          </div>
        )}

        {/* Message text — skip if empty (attachment-only message) */}
        {message.content && (
          isUser
            ? message.content
            : <ReactMarkdown>{message.content}</ReactMarkdown>
        )}

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied message" : "Copy message"}
          title={copied ? "Copied" : "Copy"}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            background: isUser ? "rgba(255,255,255,0.12)" : "#ffffff",
            color:      isUser ? "#ffffff" : "#17172f",
            border:     isUser ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e6e1da",
            boxShadow:  isUser ? "none" : "0 4px 10px rgba(32,26,20,0.06)",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}