import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Input ──────────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export default function Input({
  label,
  error,
  icon: Icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-800 placeholder:text-gray-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
            'dark:bg-navy-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-navy-600 dark:focus:border-brand-400',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-navy-600',
            Icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ─── TextArea ───────────────────────────────────────────────────────── */

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  className,
  id,
  ...props
}: TextAreaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-800 placeholder:text-gray-400 transition-all duration-200 resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
          'dark:bg-navy-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-navy-600 dark:focus:border-brand-400',
          error
            ? 'border-red-400 focus:ring-red-400 focus:border-red-400 dark:border-red-500'
            : 'border-gray-200 dark:border-navy-600',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
