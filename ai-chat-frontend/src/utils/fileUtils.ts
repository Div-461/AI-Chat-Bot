import type { Attachment } from "../types/chat";

// Allowed MIME types and their display labels
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf":  "PDF",
  "image/png":        "PNG",
  "image/jpeg":       "JPG",
  "image/webp":       "WEBP",
  "text/plain":       "TXT",
  "text/csv":         "CSV",
};

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILES = 2;

export function isAllowedType(mimeType: string): boolean {
  return mimeType in ALLOWED_TYPES;
}

export function isAllowedSize(bytes: number): boolean {
  return bytes <= MAX_FILE_SIZE_MB * 1024 * 1024;
}

export function getFileLabel(mimeType: string): string {
  return ALLOWED_TYPES[mimeType] ?? "FILE";
}

// Converts a File to base64 string (strips the data:...;base64, prefix)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip the data URL prefix
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Converts a browser File to our Attachment type
export async function fileToAttachment(file: File): Promise<Attachment> {
  return {
    id:       crypto.randomUUID(),
    name:     file.name,
    mimeType: file.type,
    file,
    size:     file.size,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
