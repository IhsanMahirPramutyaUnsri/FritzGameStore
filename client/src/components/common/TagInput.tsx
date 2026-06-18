import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function TagInput({
  label,
  value,
  onChange,
  placeholder = 'Ketik dan tekan Enter...',
  error,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setInputValue('');
      return;
    }
    onChange([...value, tag]);
    setInputValue('');
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const parts = text.split(/[,\n]+/);
    const newTags = parts
      .map((p) => p.trim())
      .filter((p) => p && !value.includes(p));
    if (newTags.length > 0) {
      onChange([...value, ...newTags]);
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap gap-1.5 rounded-lg border bg-white px-3 py-2 min-h-[42px] cursor-text transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-brand-400',
          'dark:bg-navy-800 dark:border-navy-600 dark:focus-within:border-brand-400',
          error
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-200 dark:border-navy-600'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400 px-2 py-0.5 text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="rounded-full p-0.5 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
              aria-label={`Hapus ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-navy-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 py-0"
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
