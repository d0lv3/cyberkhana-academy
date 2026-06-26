import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface DynamicListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onChange: (updated: T) => void) => React.ReactNode;
  createItem: () => T;
  label?: string;
  addLabel?: string;
  maxItems?: number;
}

function DynamicList<T>({
  items,
  onChange,
  renderItem,
  createItem,
  label,
  addLabel = 'Add Item',
  maxItems = 20,
}: DynamicListProps<T>) {
  const addItem = () => {
    if (items.length < maxItems) {
      onChange([...items, createItem()]);
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updated: T) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#9aa5bf] mb-2">{label}</label>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="group flex items-start gap-2 p-3 rounded-lg bg-[#0a0f18] border border-[#263248]"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20 transition-colors"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === items.length - 1}
                className="text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20 transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Item content */}
            <div className="flex-1 min-w-0">
              {renderItem(item, index, (updated) => updateItem(index, updated))}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#00a859]/40 hover:text-[#00a859] transition-all w-full justify-center"
        >
          <Plus size={13} /> {addLabel}
        </button>
      )}
    </div>
  );
}

export default DynamicList;
