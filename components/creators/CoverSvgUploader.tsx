import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, AlertTriangle, Trash2, Code2 } from 'lucide-react';
import CardArt, { type CardArtKind } from '../fundamentals/CardArt';

interface CoverSvgUploaderProps {
  value: string;
  onChange: (svg: string) => void;
  /** Accent + scene used for the empty-state preview (matches the live card). */
  accent?: string;
  kind?: CardArtKind;
  glyph?: string;
}

function validate(svg: string): string | null {
  if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
    return 'That doesn’t look like valid SVG markup (must start with <svg> and close).';
  }
  if (svg.length > 200_000) {
    return 'SVG is too large (max ~200 KB). Simplify it or upload a smaller file.';
  }
  return null;
}

/**
 * Cover-art picker that stores raw SVG markup. Creators can upload a `.svg`
 * file or paste markup; the preview mirrors the student-facing card. Stored
 * SVG is rendered as a sandboxed data-URI image on cards, so pasted markup
 * can't execute scripts. The textarea keeps a local draft so partial markup
 * can be typed without being rejected mid-edit; only valid SVG is committed.
 */
const CoverSvgUploader: React.FC<CoverSvgUploaderProps> = ({
  value,
  onChange,
  accent = '#60a5fa',
  kind = 'network',
  glyph,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);

  // Reflect external changes (upload / remove) back into the textarea.
  useEffect(() => setDraft(value), [value]);

  const commit = (raw: string) => {
    setDraft(raw);
    const svg = raw.trim();
    if (svg === '') {
      setError(null);
      onChange('');
      return;
    }
    const err = validate(svg);
    if (err) {
      setError(err); // keep the draft visible, don't push invalid markup up
      return;
    }
    setError(null);
    onChange(svg);
  };

  const handleFile = async (file: File) => {
    try {
      commit(await file.text());
      setShowPaste(true);
    } catch {
      setError('Could not read that file.');
    }
  };

  const remove = () => {
    setDraft('');
    setError(null);
    onChange('');
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
        Cover Art <span className="text-[#6e7a94] font-normal">(SVG — optional)</span>
      </label>
      <div className="flex items-stretch gap-3">
        {/* Square preview — matches the card tile */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#263248]">
          <CardArt kind={kind} color={accent} glyph={glyph} svg={value || undefined} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/70 to-transparent" />
        </div>

        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#d2d7e3] hover:border-[#00a859]/50 transition-colors"
            >
              <UploadCloud size={13} /> {value ? 'Replace SVG' : 'Upload .svg'}
            </button>
            <button
              type="button"
              onClick={() => setShowPaste((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs font-semibold text-[#9aa5bf] hover:text-[#d2d7e3] transition-colors"
            >
              <Code2 size={13} /> Paste
            </button>
            {value && (
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
            Leave empty to use the built-in generated art. SVG only · max ~200 KB.
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
          onChange={(e) => commit(e.target.value)}
          placeholder="<svg viewBox='0 0 400 400' ...>…</svg>"
          rows={4}
          spellCheck={false}
          className="mt-3 w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-xs text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50 transition-colors"
          dir="ltr"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/svg+xml,.svg"
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

export default CoverSvgUploader;
