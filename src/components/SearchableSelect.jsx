import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  labelKey = 'label',
  valueKey = 'value',
  placeholder = 'Search...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => o[valueKey] === value);

  const filtered = options.filter(o =>
    o[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`input-field flex items-center cursor-pointer ${disabled ? 'bg-gray-100' : ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <span className={`flex-1 truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="ml-2 text-gray-400 hover:text-gray-600 min-w-[24px] min-h-[24px] flex items-center justify-center"
          >
            &times;
          </button>
        )}
        <svg className="w-5 h-5 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option[valueKey]}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 transition-colors min-h-[48px] flex items-center ${
                    option[valueKey] === value ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {option[labelKey]}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
