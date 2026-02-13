'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = 'https://api-adresse.data.gouv.fr/search/';

interface AddressFeature {
  type: string;
  geometry: { type: string; coordinates: number[] };
  properties: {
    label: string;
    city: string;
    postcode: string;
    street?: string;
  };
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Appelé lors de la sélection d’une suggestion (adresse complète, ville, code postal) */
  onSuggestionSelect?: (address: string, city: string, postcode: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
  id?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = '25 avenue des Champs-Élysées, 75008 Paris',
  required,
  style,
  id,
  disabled,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Adresse complète sélectionnée : ne pas rouvrir le menu après sélection */
  const lastSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    setQuery(value);
    if (value.trim()) lastSelectedRef.current = value.trim();
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}?q=${encodeURIComponent(trimmed)}&limit=15`
      );
      const data = await res.json();
      const features = (data.features || []) as AddressFeature[];
      const withType = features as (AddressFeature & { properties: { type?: string } })[];
      const onlyFullAddresses = withType.filter(
        (f) => f.properties?.type === 'housenumber' || f.properties?.type === 'street'
      );
      setSuggestions(onlyFullAddresses);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      lastSelectedRef.current = null;
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    if (query.trim() === lastSelectedRef.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
      setIsOpen(true);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (feature: AddressFeature) => {
    const label = feature.properties.label;
    const city = feature.properties.city ?? '';
    const postcode = feature.properties.postcode ?? '';
    lastSelectedRef.current = label;
    onChange(label);
    onSuggestionSelect?.(label, city, postcode);
    setQuery(label);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (v.trim() !== lastSelectedRef.current) lastSelectedRef.current = null;
  };

  const handleFocus = () => {
    if (query.trim() === lastSelectedRef.current && lastSelectedRef.current) return;
    if (suggestions.length > 0) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    padding: '0 16px',
    fontSize: 15,
    border: '1px solid #d2d2d7',
    borderRadius: 12,
    boxSizing: 'border-box',
    outline: 'none',
    ...style,
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        id={id}
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        style={inputStyle}
      />
      {isOpen && lastSelectedRef.current !== query.trim() && (query.trim().length >= 3 || suggestions.length > 0) && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            marginTop: 4,
            padding: 0,
            listStyle: 'none',
            backgroundColor: '#fff',
            border: '1px solid #d2d2d7',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {loading && (
            <li style={{ padding: 12, fontSize: 13, color: '#86868b' }}>
              Recherche...
            </li>
          )}
          {!loading && suggestions.length === 0 && query.trim().length >= 3 && (
            <li style={{ padding: 12, fontSize: 13, color: '#86868b' }}>
              Aucune adresse trouvée
            </li>
          )}
          {!loading &&
            suggestions.map((feature, index) => {
              const label = feature.properties.label;
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={feature.properties.label + index}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(feature)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 14,
                    cursor: 'pointer',
                    backgroundColor: isHighlighted ? '#f5f5f7' : 'transparent',
                    borderBottom:
                      index < suggestions.length - 1
                        ? '1px solid #eee'
                        : 'none',
                  }}
                >
                  {label}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
