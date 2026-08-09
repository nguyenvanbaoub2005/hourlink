import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, X } from 'lucide-react';
import { VIETNAM_PROVINCES } from '@/constants/provinces';

interface Props {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export default function RegionPicker({ value, onChange, label = 'Khu vực', placeholder = 'Chọn tỉnh / thành phố...' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProvinces = VIETNAM_PROVINCES.filter(p =>
    p.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <MapPin size={14} className="text-primary" />
          {label}
        </label>
      )}

      {/* Select Box Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm flex items-center justify-between cursor-pointer transition ${
          isOpen ? 'border-primary ring-2 ring-primary/20 bg-white' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={value ? 'font-medium text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearch('');
              }}
              className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tỉnh / thành..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* List of Provinces */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredProvinces.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy tỉnh/thành</p>
            ) : (
              filteredProvinces.map((p) => {
                const isSelected = value === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{p}</span>
                    {isSelected && <span className="text-primary font-bold">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
