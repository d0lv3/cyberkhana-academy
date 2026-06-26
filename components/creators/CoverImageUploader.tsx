import React, { useCallback, useRef, useState } from 'react';
import { ImagePlus, Loader2, AlertTriangle, Trash2, Layers } from 'lucide-react';
import { api } from '../../services/api';

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  /** Accent color used for the empty-state preview tint. */
  accent?: string;
}

/**
 * Square cover-image picker for modules. Uploads to the server (`/uploads`,
 * same allowlist as inline images — PNG/JPEG/WebP/GIF, 2 MB) and stores the
 * returned absolute URL. The preview mirrors how the module tile will look.
 */
const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  value,
  onChange,
  accent = '#34d399',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const { url } = await api.upload<{ url: string }>('/uploads', 'image', file);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Cover Image</label>
      <div className="flex items-stretch gap-3">
        {/* Square preview — matches the module tile */}
        <div
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#263248]"
          style={value ? undefined : { background: `linear-gradient(150deg, ${accent}33 0%, #0d1117 70%)` }}
        >
          {value ? (
            <img src={value} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Layers size={22} style={{ color: accent }} className="opacity-50" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#d2d7e3] hover:border-[#00a859]/50 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#9aa5bf] hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#6e7a94]">
            PNG, JPEG, WebP or GIF · max 2 MB · shown on the module tile
          </p>
          {error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-400">
              <AlertTriangle size={11} /> {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default CoverImageUploader;
