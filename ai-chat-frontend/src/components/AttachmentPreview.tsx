import { X, FileText, Image, File } from "lucide-react";
import type { Attachment } from "../types/chat";
import { formatFileSize, getFileLabel } from "../utils/fileUtils";
import "../css/AttachmentPriview.css";

interface Props {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))      return <Image  size={12} />;
  if (mimeType === "application/pdf")     return <FileText size={12} />;
  return <File size={12} />;
}

export default function AttachmentPreview({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="attachment-preview-pill flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs"
        >
          <FileIcon mimeType={file.mimeType} />

          {/* File name — truncated */}
          <span
            className="attachment-preview-name"
            title={file.name}
          >
            {file.name}
          </span>

          {/* Size badge */}
          <span className="attachment-preview-size">
            {formatFileSize(file.size)}
          </span>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            aria-label={`Remove ${file.name}`}
            className="attachment-preview-remove flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
