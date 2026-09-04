import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle, FilePlus2, Loader2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import {
  LAB_FILE_EXTENSIONS,
  LAB_FILE_MAX_BYTES,
  formatBytes,
  labFileAccept,
  labFileKind,
  labUid,
  type LabFile,
} from '../../services/labTypes';

interface LabFileUploaderProps {
  value: LabFile[];
  onChange: (files: LabFile[]) => void;
  maxFiles?: number;
}

/**
 * Attaches the supporting files a lab hands out: a capture, a worksheet, a
 * config, a small archive. Uploads go to their own endpoint, which serves
 * everything back as a forced download, so nothing attached here can render
 * in the browser as part of the site.
 *
 * Size is checked here as well as on the server, because finding out a 300 MB
 * disk image is too big after uploading it is a worse experience than being
 * told before it starts.
 */
const LabFileUploader: React.FC<LabFileUploaderProps> = ({ value, onChange, maxFiles = 8 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!labFileKind(file.name)) {
        setError(`That file type isn't allowed. Accepted: ${LAB_FILE_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > LAB_FILE_MAX_BYTES) {
        setError(
          `${formatBytes(file.size)} is over the ${formatBytes(
            LAB_FILE_MAX_BYTES
          )} limit. Link to anything bigger instead of hosting it here.`
        );
        return;
      }

      setUploading(true);
      try {
        const uploaded = await api.upload<{
          url: string;
          name: string;
          kind: string;
          bytes: number;
        }>('/uploads/lab-resource', 'file', file);
        onChange([...value, { id: labUid('file'), ...uploaded }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onChange, value]
  );

  const remove = (id: string) => onChange(value.filter((f) => f.id !== id));

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 space-y-2">
          {value.map((file) => (
            <li
              key={file.id}
              className="group flex items-center gap-3 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2.5"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[#263248] bg-[#0d1420] text-[10px] font-bold uppercase text-[#60a5fa]">
                {file.kind || 'file'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[#d2d7e3]">
                  {file.name}
                </span>
                <span className="block text-[10px] text-[#7c8aa6]" dir="ltr">
                  {formatBytes(file.bytes)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(file.id)}
                aria-label={`Remove ${file.name}`}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#7c8aa6] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < maxFiles && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#263248] bg-[#0d1420] px-3 py-2 text-xs font-medium text-[#8592ad] transition-all hover:border-[#f3a43a]/40 hover:text-[#f3a43a] disabled:opacity-50"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <FilePlus2 size={13} />}
          {uploading ? 'Uploading…' : 'Attach a file'}
        </button>
      )}

      <p className="mt-1.5 text-[11px] text-[#8592ad]">
        Up to {formatBytes(LAB_FILE_MAX_BYTES)} each. Students download these, they never open in
        the page. Host a VM image somewhere else and add it as a link.
      </p>

      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[11px] text-red-400">
          <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={labFileAccept}
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

export default LabFileUploader;
