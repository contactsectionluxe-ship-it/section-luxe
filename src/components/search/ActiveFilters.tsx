'use client';

import { X } from 'lucide-react';
import { SearchFilters as Filters } from '@/types/filters';
import {
  ARTICLE_TYPES,
  LUXURY_BRANDS,
  CONDITIONS,
  COLORS,
  MATERIALS,
  REGIONS,
} from '@/lib/constants';

interface ActiveFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function getFilterLabel(key: string, value: any): string | null {
  switch (key) {
    case 'category':
      return ARTICLE_TYPES.find(t => t.value === value)?.label || value;
    case 'brand':
      return value;
    case 'model':
      return `Modèle: ${value}`;
    case 'priceMin':
      return `Min: ${value}€`;
    case 'priceMax':
      return `Max: ${value}€`;
    case 'yearMin':
      return `Depuis ${value}`;
    case 'yearMax':
      return `Jusqu'à ${value}`;
    case 'condition':
      return CONDITIONS.find(c => c.value === value)?.label || value;
    case 'region':
      return REGIONS.find(r => r.value === value)?.label || value;
    case 'postalCode':
      return `CP: ${value}`;
    case 'deliveryAvailable':
      return 'Livraison';
    case 'color':
      return COLORS.find(c => c.value === value)?.label || value;
    case 'material':
      return MATERIALS.find(m => m.value === value)?.label || value;
    case 'firstHand':
      return 'Première main';
    case 'hasCertificate':
      return 'Certificat inclus';
    case 'query':
      return `"${value}"`;
    default:
      return null;
  }
}

export function ActiveFilters({ filters, onChange }: ActiveFiltersProps) {
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== '' && key !== 'sortBy'
  );

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete (newFilters as any)[key];
    onChange(newFilters);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
      {activeFilters.map(([key, value]) => {
        const label = getFilterLabel(key, value);
        if (!label) return null;
        
        return (
          <button
            key={key}
            onClick={() => removeFilter(key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              fontSize: 13,
              color: '#444',
              cursor: 'pointer',
            }}
          >
            {label}
            <X size={14} />
          </button>
        );
      })}
    </div>
  );
}
