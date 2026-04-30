import { Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { cn } from '@/lib/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps): ReactElement {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3', className)}>
      <Search size={16} className="shrink-0 text-[#9f9f9f]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-white outline-none placeholder:text-[#6f6f6f]"
        placeholder={placeholder}
      />
    </div>
  );
}
