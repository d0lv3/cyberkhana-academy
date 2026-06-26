import React, { useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  label,
}) => {
  const [input, setInput] = useState('');

  const addTag = useCallback(() => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  }, [input, value, onChange]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Backspace' && !input && value.length > 0) {
        removeTag(value[value.length - 1]);
      }
    },
    [addTag, input, value, removeTag]
  );

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">{label}</label>
      )}

      {/* Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#1a2332] border border-[#263248] text-[#d2d7e3]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[#6e7a94] hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]"
          dir="ltr"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2332] border border-[#263248] text-[#6e7a94] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default TagInput;
