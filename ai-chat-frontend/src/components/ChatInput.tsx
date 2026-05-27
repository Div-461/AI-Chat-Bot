import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { SendHorizontal, Paperclip } from "lucide-react";
import clsx from "clsx";
import type { Attachment } from "../types/chat";
import AttachmentPreview from "./AttachmentPreview";
import {
  isAllowedType,
  isAllowedSize,
  fileToAttachment,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} from "../utils/fileUtils";
import "../css/ChatInput.css";

interface Props {
  onSend:          (message: string) => void;
  onAddAttachments:(attachments: Attachment[]) => void;
  onRemoveAttachment:(id: string) => void;
  attachments:     Attachment[];
  disabled:        boolean;
}

export default function ChatInput({
  onSend,
  onAddAttachments,
  onRemoveAttachment,
  attachments,
  disabled,
}: Props) {
  const [value, setValue]       = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!value.trim() && attachments.length === 0) || disabled) return;
    onSend(value);
    setValue("");
    setFileError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Check total cap
    if (attachments.length + files.length > MAX_FILES) {
      setFileError(`Max ${MAX_FILES} files per message.`);
      e.target.value = "";
      return;
    }

    const errors: string[] = [];
    const valid: File[]    = [];

    for (const file of files) {
      if (!isAllowedType(file.type)) {
        errors.push(`"${file.name}" — unsupported type.`);
      } else if (!isAllowedSize(file.size)) {
        errors.push(`"${file.name}" — exceeds ${MAX_FILE_SIZE_MB} MB.`);
      } else {
        valid.push(file);
      }
    }

    if (errors.length > 0) {
      setFileError(errors[0]); // show first error
    }

    if (valid.length > 0) {
      const converted = await Promise.all(valid.map(fileToAttachment));
      onAddAttachments(converted);
    }

    // Reset so the same file can be re-selected if removed
    e.target.value = "";
  };

  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0);
  const canAttach = !disabled && attachments.length < MAX_FILES;

  return (
    <div>
      <div
        className={clsx("chat-input-shell", canSend && "chat-input-shell-active")}
      >
        {/* Attachment pills — shown above the text area */}
        {attachments.length > 0 && (
          <div className="chat-input-attachments">
            <AttachmentPreview
              attachments={attachments}
              onRemove={onRemoveAttachment}
            />
          </div>
        )}

        {/* Text row */}
        <div className="chat-input-row flex items-end gap-2 px-4 py-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
            onChange={handleFileChange}
            className="chat-input-file"
            aria-hidden="true"
          />

          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAttach}
            aria-label="Attach files"
            title="Attach files (PDF, image, text)"
            className="chat-input-attach shrink-0 flex items-center justify-center rounded-lg transition-colors"
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={
              attachments.length > 0
                ? "Ask about the attached files…"
                : "Type a message…"
            }
            rows={1}
            disabled={disabled}
            className={clsx(
              "chat-input-textarea",
              "placeholder:text-[#9c9690]",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className="chat-input-send shrink-0 flex items-center justify-center rounded-xl transition-all"
          >
            <SendHorizontal size={20} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      {/* File error */}
      {fileError && (
        <p
          className="chat-input-error text-xs mt-1.5 px-2"
        >
          {fileError}
        </p>
      )}

      {/* Keyboard hints */}
      <p className="chat-input-hints">
        <kbd className="chat-input-key">
          Enter
        </kbd>{" "}
        send
        <kbd className="chat-input-key chat-input-key-spaced">
          Shift + Enter
        </kbd>{" "}
        new line
      </p>
    </div>
  );
}
