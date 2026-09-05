import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface Option {
  value: string;
  label: string;
}

interface AsyncSearchSelectProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  value: string;
  /** Label to show for the current value before/without searching (e.g. when editing an existing row). */
  displayLabel?: string;
  onChange: (value: string, label: string) => void;
  onBlur?: () => void;
  fetchOptions: (query: string) => Promise<Option[]>;
}

export function AsyncSearchSelect({
  label,
  required,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  error,
  value,
  displayLabel,
  onChange,
  onBlur,
  fetchOptions,
}: AsyncSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const shownLabel = selectedLabel || displayLabel || '';

  const { data: options = [], isFetching: loading } = useQuery({
    queryKey: ['async-search-select', debouncedQuery],
    queryFn: () => fetchOptions(debouncedQuery),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        onBlur?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onBlur]);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`
            w-full h-11 rounded-xl border bg-white text-sm px-4 pr-10 text-left outline-none transition-all
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
            ${value && shownLabel ? 'text-slate-900' : 'text-slate-400'}
          `}
        >
          {value && shownLabel ? shownLabel : placeholder}
        </button>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="relative p-2 border-b border-slate-100">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm pl-8 pr-3 outline-none focus:border-blue-500"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {loading && (
                <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Searching...
                </div>
              )}
              {!loading && options.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400">No results</div>
              )}
              {!loading && options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value, o.label);
                    setSelectedLabel(o.label);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                    o.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
