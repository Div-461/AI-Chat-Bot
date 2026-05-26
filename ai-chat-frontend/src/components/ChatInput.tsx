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
        style={{
          //background:   "#f8f7f5",
          border:       `1px solid #00000059`,
          borderRadius: 4,
          boxShadow:    canSend ? "0 0 0 3px rgba(23,23,47,0.05)" : "none",
          transition:   "border-color 0.2s, box-shadow 0.2s",
          overflow:     "hidden",
        }}
      >
        {/* Attachment pills — shown above the text area */}
        {attachments.length > 0 && (
          <div style={{ padding: "10px 12px 0" }}>
            <AttachmentPreview
              attachments={attachments}
              onRemove={onRemoveAttachment}
            />
          </div>
        )}

        {/* Text row */}
        <div className="flex items-end gap-2 px-4 py-2" style={{ minHeight: 54 }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAttach}
            aria-label="Attach files"
            title="Attach files (PDF, image, text)"
            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
            style={{
              width:      34,
              height:     34,
              marginBottom: 4,
              background: canAttach ? "transparent" : "transparent",
              color:      canAttach ? "#6f6760" : "#c4bfba",
              cursor:     canAttach ? "pointer" : "not-allowed",
              border:     "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (canAttach)
                (e.currentTarget as HTMLButtonElement).style.background = "#ece8e3";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
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
            style={{
              flex:        1,
              resize:      "none",
              outline:     "none",
              fontSize:    16,
              color:       "#17172f",
              background:  "transparent",
              maxHeight:   160,
              lineHeight:  1.5,
              paddingTop:  10,
              paddingBottom: 10,
            }}
            className={clsx(
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
            className="shrink-0 flex items-center justify-center rounded-xl transition-all"
            style={{
              width:        42,
              height:       42,
              marginBottom: 2,
              background:   "#17172f",
              color:        "#ffffff",
              border:       "none",
              cursor:       canSend ? "pointer" : "not-allowed",
              opacity:      canSend ? 1 : 0.4,
              boxShadow:    canSend
                ? "0 10px 18px rgba(23,23,47,0.2)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (canSend)
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <SendHorizontal size={20} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      {/* File error */}
      {fileError && (
        <p
          className="text-xs mt-1.5 px-2"
          style={{ color: "#b42318" }}
        >
          {fileError}
        </p>
      )}

      {/* Keyboard hints */}
      <p style={{ textAlign: "center", fontSize: 11, marginTop: 8, marginBottom: 8 }}>
        <kbd style={{ background: "#f8f7f5", border: "1px solid #e1dbd4", borderRadius: 4, padding: "1px 7px", fontSize: 10, color: "#9b958f" }}>
          Enter
        </kbd>{" "}
        send
        <kbd style={{ background: "#f8f7f5", marginLeft:10,
          border: "1px solid #e1dbd4", borderRadius: 4, padding: "1px 7px", fontSize: 10, color: "#9b958f" }}>
          Shift+Enter
        </kbd>{" "}
        new line
      </p>
    </div>
  );
}