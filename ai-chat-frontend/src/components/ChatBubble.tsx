import clsx from "clsx";
import { lazy, memo, Suspense, useMemo, useState } from "react";
import { Check, Copy, FileText, Image, File } from "lucide-react";
import type { Message } from "../types/chat";
import { getFileLabel } from "../utils/fileUtils";
import "../css/ChatBubble.css";

const ReactMarkdown = lazy(() => import("react-markdown"));

interface Props {
  message: Message;
}

const AttachmentBadge = memo(function AttachmentBadge({ name, mimeType }: { name: string; mimeType: string }) {
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  return (
    <div
      className="chat-bubble-attachment inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs mb-2 mr-1"
      title={name}
    >
      {isImage ? <Image size={11} /> : isPdf ? <FileText size={11} /> : <File size={11} />}
      <span
        className="chat-bubble-attachment-name"
      >
        {name}
      </span>
      <span className="chat-bubble-attachment-label">
        {getFileLabel(mimeType)}
      </span>
    </div>
  );
});

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <Suspense fallback={<span className="whitespace-pre-wrap">{content}</span>}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </Suspense>
  );
});

function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyText = useMemo(
    () => message.content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1"),
    [message.content]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const hasAttachments = (message.attachments?.length ?? 0) > 0;

  return (
    <div
      className={clsx("chat-bubble-row flex items-end gap-2 mb-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "chat-bubble-avatar w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
          isUser ? "chat-bubble-avatar-user" : "chat-bubble-avatar-assistant"
        )}
      >
        {isUser ? "U" : "✦"}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          "chat-bubble group relative max-w-[72%] px-4 py-3 pr-11 text-sm leading-relaxed",
          isUser ? "chat-bubble-user whitespace-pre-wrap" : "chat-bubble-assistant md-content"
        )}
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
            : <MarkdownContent content={message.content} />
        )}

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied message" : "Copy message"}
          title={copied ? "Copied" : "Copy"}
          className={clsx(
            "chat-bubble-copy absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1",
            isUser ? "chat-bubble-copy-user" : "chat-bubble-copy-assistant"
          )}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default memo(ChatBubble);
