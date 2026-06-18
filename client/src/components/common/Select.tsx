import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'block w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-navy-800 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
            'dark:bg-navy-800 dark:text-gray-100 dark:border-navy-600 dark:focus:border-brand-400',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-navy-600',
            !value && 'text-gray-400 dark:text-gray-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
