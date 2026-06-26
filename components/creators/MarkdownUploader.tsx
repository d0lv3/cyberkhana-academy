import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Edit3, ImagePlus, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface MarkdownUploaderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownUploader: React.FC<MarkdownUploaderProps> = ({
  value,
  onChange,
  placeholder = 'Write your markdown content here...',
}) => {
  const [mode, setMode] = useState<'editor' | 'upload'>('editor');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Upload an image to the server and insert markdown at the caret. */
  const handleImageFile = useCallback(
    async (file: File) => {
      setImageError(null);
      setImageUploading(true);
      try {
        const { url } = await api.upload<{ url: string }>('/uploads', 'image', file);
        const alt = file.name.replace(/\.[^.]+$/, '');
        const snippet = `![${alt}](${url})`;

        const textarea = textareaRef.current;
        if (textarea && mode === 'editor') {
          const start = textarea.selectionStart ?? value.length;
          const end = textarea.selectionEnd ?? value.length;
          const before = value.slice(0, start);
          const after = value.slice(end);
          const pad = before && !before.endsWith('\n') ? '\n\n' : '';
          onChange(`${before}${pad}${snippet}\n${after}`);
        } else {
          onChange(`${value}${value && !value.endsWith('\n') ? '\n\n' : ''}${snippet}\n`);
        }
      } catch (err) {
        setImageError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setImageUploading(false);
      }
    },
    [mode, onChange, value]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && !file.name.endsWith('.txt')) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onChange(text);
        setFileName(file.name);
        setMode('editor'); // Switch to editor so they can see/edit the content
      };
      reader.readAsText(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 bg-[#0b1019] rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'editor'
              ? 'bg-[#1a2332] text-[#f3f6ff] border border-[#263248]'
              : 'text-[#6e7a94] hover:text-[#d2d7e3]'
          }`}
        >
          <Edit3 size={12} /> Editor
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-[#1a2332] text-[#f3f6ff] border border-[#263248]'
              : 'text-[#6e7a94] hover:text-[#d2d7e3]'
          }`}
        >
          <Upload size={12} /> Upload
        </button>
        {fileName && (
          <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#00a859]">
            <FileText size={10} /> {fileName}
          </span>
        )}

        {/* Insert image — uploads to the server, inserts ![...](url) */}
        <span className="w-px h-4 bg-[#263248] mx-0.5" />
        <button
          type="button"
          disabled={imageUploading}
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#6e7a94] hover:text-[#9fef00] transition-colors disabled:opacity-50"
          title="Upload an image (PNG, JPEG, WebP, GIF — max 2 MB)"
        >
          {imageUploading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ImagePlus size={12} />
          )}
          {imageUploading ? 'Uploading…' : 'Insert Image'}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImageFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {imageError && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertTriangle size={11} /> {imageError}
        </p>
      )}

      {/* Content */}
      {mode === 'editor' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] bg-[#0a0f18] border border-[#263248] rounded-lg px-4 py-3 text-sm text-[#c4cad6] font-mono resize-y focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63] custom-scrollbar"
          spellCheck={false}
          dir="ltr"
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 min-h-[200px] rounded-lg border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-[#00a859] bg-[#00a859]/5'
              : 'border-[#263248] bg-[#0a0f18] hover:border-[#354562]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-[#00a859]/10' : 'bg-[#1a2332]'
            }`}
          >
            <Upload
              size={22}
              className={isDragging ? 'text-[#00a859]' : 'text-[#6e7a94]'}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#d2d7e3]">
              {isDragging ? 'Drop your file here' : 'Drag & drop a .md file'}
            </p>
            <p className="text-xs text-[#6e7a94] mt-1">or click to browse</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default MarkdownUploader;
