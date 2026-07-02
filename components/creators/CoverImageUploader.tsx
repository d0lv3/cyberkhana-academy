import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, AlertTriangle, Trash2, Layers, Code2 } from 'lucide-react';
import { api } from '../../services/api';
import { coverImageSrc, isSvgCover } from '../../data/fundamentalsData';

interface CoverImageUploaderProps {
  value: string;
  onChange: (cover: string) => void;
  /** Accent color used for the empty-state preview tint. */
  accent?: string;
  /** Field label (defaults to "Cover Image"). */
  label?: string;
  /** Where the cover appears, e.g. "module tile" (used in the helper line). */
  shownOn?: string;
}

/** Validate pasted/uploaded SVG markup (rendered sandboxed, but keep it sane). */
function validateSvg(svg: string): string | null {
  if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
    return 'That doesn’t look like valid SVG markup (must start with <svg> and close).';
  }
  if (svg.length > 200_000) {
    return 'SVG is too large (max ~200 KB). Simplify it or upload a smaller file.';
  }
  return null;
}

/**
 * Square cover picker for modules. Accepts either a raster image (uploaded to
 * `/uploads` — PNG/JPEG/WebP/GIF, 2 MB — storing the returned URL) or raw SVG
 * (uploaded `.svg` file or pasted markup, stored verbatim). SVG is rendered as
 * a sandboxed data-URI image everywhere via `coverImageSrc()`, so pasted markup
 * can't execute scripts. The preview mirrors the live module tile.
 */
const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  value,
  onChange,
  accent = '#34d399',
  label = 'Cover Image',
  shownOn = 'the module tile',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [draft, setDraft] = useState(isSvgCover(value) ? value : '');

  const isSvg = isSvgCover(value);

  // Reflect external SVG changes back into the textarea draft.
  useEffect(() => {
    if (isSvgCover(value)) setDraft(value);
  }, [value]);

  const commitSvg = useCallback(
    (raw: string) => {
      setDraft(raw);
      const svg = raw.trim();
      if (svg === '') {
        setError(null);
        onChange('');
        return;
      }
      const err = validateSvg(svg);
      if (err) {
        setError(err); // keep the draft visible, don't push invalid markup up
        return;
      }
      setError(null);
      onChange(svg);
    },
    [onChange]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const isSvgFile = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);

      if (isSvgFile) {
        try {
          const text = await file.text();
          setShowPaste(true);
          commitSvg(text);
        } catch {
          setError('Could not read that file.');
        }
        return;
      }

      // Raster → upload to the server, store the URL.
      setUploading(true);
      try {
        const { url } = await api.upload<{ url: string }>('/uploads', 'image', file);
        setDraft('');
        setShowPaste(false);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setUploading(false);
      }
    },
    [commitSvg, onChange]
  );

  const remove = () => {
    setDraft('');
    setShowPaste(false);
    setError(null);
    onChange('');
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">{label}</label>
      <div className="flex items-stretch gap-3">
        {/* Square preview — matches the module tile */}
        <div
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#263248]"
          style={value ? undefined : { background: `linear-gradient(150deg, ${accent}33 0%, #0d1117 70%)` }}
        >
          {value ? (
            <img src={coverImageSrc(value)} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Layers size={22} style={{ color: accent }} className="opacity-50" />
            </div>
          )}
          {isSvg && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-[#9fef00] backdrop-blur-sm">
              SVG
            </span>
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
              {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload image / SVG'}
            </button>
            <button
              type="button"
              onClick={() => setShowPaste((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#9aa5bf] hover:text-[#d2d7e3] transition-colors"
            >
              <Code2 size={13} /> Paste SVG
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#9aa5bf] hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#6e7a94]">
            PNG, JPEG, WebP, GIF (max 2 MB) or SVG (max ~200 KB) · shown on {shownOn}
          </p>
          {error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-400">
              <AlertTriangle size={11} /> {error}
            </p>
          )}
        </div>
      </div>

      {showPaste && (
        <textarea
          value={draft}
          onChange={(e) => commitSvg(e.target.value)}
          placeholder="<svg viewBox='0 0 800 800' ...>…</svg>"
          rows={4}
          spellCheck={false}
          className="mt-3 w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-xs text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50 transition-colors"
          dir="ltr"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
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
