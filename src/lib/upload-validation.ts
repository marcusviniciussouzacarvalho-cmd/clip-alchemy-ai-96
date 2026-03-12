const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/mpeg",
];

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".mpeg"];

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateVideoFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo muito grande. Máximo: 5GB (${formatSize(file.size)})` };
  }

  if (file.size === 0) {
    return { valid: false, error: "Arquivo vazio" };
  }

  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    const ext = getExtension(file.name);
    // Fallback: check extension if MIME type is generic
    if (!ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
      return { valid: false, error: `Formato não suportado: ${file.type || ext}. Use MP4, MOV, AVI, MKV ou WebM.` };
    }
  }

  // Check filename for safety
  if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
    return { valid: false, error: "Nome do arquivo contém caracteres inválidos" };
  }

  return { valid: true };
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i) : "";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
