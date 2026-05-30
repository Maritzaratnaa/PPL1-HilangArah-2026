import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
  detail?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
}

export function SearchableDropdown({
  options, value, onChange, placeholder = 'Pilih...',
  searchPlaceholder, disabled = false, className = '', triggerClassName = '', dropdownClassName = ''
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.detail || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group options — preserve insertion order
  const groupOrder: string[] = [];
  const groups = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    const g = opt.group || '__none__';
    if (!acc[g]) {
      acc[g] = [];
      groupOrder.push(g);
    }
    acc[g].push(opt);
    return acc;
  }, {});

  const open = () => { if (!disabled) { setIsOpen(true); setSearch(''); } };
  const close = () => { setIsOpen(false); setSearch(''); };

  const handleSelect = (val: string) => {
    onChange(val);
    close();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <div
        onClick={open}
        className={`w-full h-10 px-3 rounded-lg border bg-background flex items-center gap-2 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-border hover:border-primary/50'
          } ${triggerClassName}`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || placeholder}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
            {selected ? selected.label : placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !isOpen && (
            <span
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer">
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className={`max-h-52 overflow-y-auto ${dropdownClassName}`}>
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">Tidak ditemukan.</div>
              ) : (
                groupOrder.map((group) => (
                  <div key={group}>
                    {/* Group header — tidak pakai sticky */}
                    {group !== '__none__' && (
                      <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-y border-border/40">
                        {group}
                      </div>
                    )}
                    {groups[group].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full text-left px-3 py-2.5 transition-colors border-b border-border/30 last:border-0
                          ${value === opt.value
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted/50 text-foreground'
                          }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        {opt.detail && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{opt.detail}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}