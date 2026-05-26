import { X, FileText, Image, File } from "lucide-react";
import type { Attachment } from "../types/chat";
import { formatFileSize, getFileLabel } from "../utils/fileUtils";

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
          className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs"
          style={{
            background:  "#f0ede9",
            border:      "1px solid #e0dbd4",
            color:       "#3d3830",
            maxWidth:    200,
          }}
        >
          <FileIcon mimeType={file.mimeType} />

          {/* File name — truncated */}
          <span
            style={{
              maxWidth:     120,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
            title={file.name}
          >
            {file.name}
          </span>

          {/* Size badge */}
          <span style={{ color: "#9c9690", flexShrink: 0 }}>
            {formatFileSize(file.size)}
          </span>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            aria-label={`Remove ${file.name}`}
            className="flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
            style={{ width: 18, height: 18, flexShrink: 0 }}
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}