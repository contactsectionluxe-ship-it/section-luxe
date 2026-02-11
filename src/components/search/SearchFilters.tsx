'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X, RotateCcw } from 'lucide-react';
import { SearchFilters as Filters } from '@/types/filters';
import {
  ARTICLE_TYPES,
  LUXURY_BRANDS,
  CONDITIONS,
  COLORS,
  MATERIALS,
  REGIONS,
  YEARS,
} from '@/lib/constants';

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  resultsCount: number;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #eee' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          background: 'none',
          border: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: '#1a1a1a',
          cursor: 'pointer',
        }}
      >
        {title}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function SearchFilters({ filters, onChange, onReset, resultsCount }: SearchFiltersProps) {
  const updateFilter = (key: keyof Filters, value: any) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div style={{ backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        borderBottom: '1px solid #eee',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Filtres</h2>
          <p style={{ fontSize: 13, color: '#888' }}>{resultsCount} résultat{resultsCount > 1 ? 's' : ''}</p>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              background: 'none',
              border: '1px solid #ddd',
              fontSize: 13,
              color: '#666',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Type d'article */}
      <FilterSection title="Type d'article" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ARTICLE_TYPES.map((type) => (
            <label
              key={type.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === type.value}
                onChange={() => updateFilter('category', type.value)}
                style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
              />
              <span style={{ fontSize: 14, color: '#444' }}>{type.label}</span>
            </label>
          ))}
          {filters.category && (
            <button
              onClick={() => updateFilter('category', undefined)}
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#888',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Voir tout
            </button>
          )}
        </div>
      </FilterSection>

      {/* Marque */}
      <FilterSection title="Marque" defaultOpen={true}>
        <select
          value={filters.brand || ''}
          onChange={(e) => updateFilter('brand', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="">Toutes les marques</option>
          {LUXURY_BRANDS.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </FilterSection>

      {/* Modèle */}
      <FilterSection title="Modèle / Collection">
        <input
          type="text"
          value={filters.model || ''}
          onChange={(e) => updateFilter('model', e.target.value)}
          placeholder="Ex: Birkin, Speedy, Submariner..."
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
          }}
        />
      </FilterSection>

      {/* Prix */}
      <FilterSection title="Prix" defaultOpen={true}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="number"
            value={filters.priceMin || ''}
            onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Min"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
            }}
          />
          <span style={{ color: '#888' }}>—</span>
          <input
            type="number"
            value={filters.priceMax || ''}
            onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Max"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
            }}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>En euros (€)</p>
      </FilterSection>

      {/* Année */}
      <FilterSection title="Année">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={filters.yearMin || ''}
            onChange={(e) => updateFilter('yearMin', e.target.value ? Number(e.target.value) : undefined)}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              backgroundColor: '#fff',
            }}
          >
            <option value="">Min</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span style={{ color: '#888' }}>—</span>
          <select
            value={filters.yearMax || ''}
            onChange={(e) => updateFilter('yearMax', e.target.value ? Number(e.target.value) : undefined)}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              backgroundColor: '#fff',
            }}
          >
            <option value="">Max</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* État */}
      <FilterSection title="État">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CONDITIONS.map((condition) => (
            <label
              key={condition.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="condition"
                checked={filters.condition === condition.value}
                onChange={() => updateFilter('condition', condition.value)}
                style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
              />
              <span style={{ fontSize: 14, color: '#444' }}>{condition.label}</span>
            </label>
          ))}
          {filters.condition && (
            <button
              onClick={() => updateFilter('condition', undefined)}
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#888',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Voir tout
            </button>
          )}
        </div>
      </FilterSection>

      {/* Localisation */}
      <FilterSection title="Localisation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={filters.postalCode || ''}
            onChange={(e) => updateFilter('postalCode', e.target.value)}
            placeholder="Code postal"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
            }}
          />
          <select
            value={filters.region || ''}
            onChange={(e) => updateFilter('region', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              backgroundColor: '#fff',
            }}
          >
            <option value="">Toutes les régions</option>
            {REGIONS.map((region) => (
              <option key={region.value} value={region.value}>{region.label}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.deliveryAvailable || false}
              onChange={(e) => updateFilter('deliveryAvailable', e.target.checked || undefined)}
              style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
            />
            <span style={{ fontSize: 14, color: '#444' }}>Livraison disponible</span>
          </label>
        </div>
      </FilterSection>

      {/* Couleur */}
      <FilterSection title="Couleur">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateFilter('color', filters.color === color.value ? undefined : color.value)}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                border: filters.color === color.value ? '1px solid #1a1a1a' : '1px solid #ddd',
                backgroundColor: filters.color === color.value ? '#1a1a1a' : '#fff',
                color: filters.color === color.value ? '#fff' : '#444',
                cursor: 'pointer',
              }}
            >
              {color.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Matériaux */}
      <FilterSection title="Matériaux">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MATERIALS.map((material) => (
            <button
              key={material.value}
              onClick={() => updateFilter('material', filters.material === material.value ? undefined : material.value)}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                border: filters.material === material.value ? '1px solid #1a1a1a' : '1px solid #ddd',
                backgroundColor: filters.material === material.value ? '#1a1a1a' : '#fff',
                color: filters.material === material.value ? '#fff' : '#444',
                cursor: 'pointer',
              }}
            >
              {material.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Historique */}
      <FilterSection title="Historique & Provenance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.firstHand || false}
              onChange={(e) => updateFilter('firstHand', e.target.checked || undefined)}
              style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
            />
            <span style={{ fontSize: 14, color: '#444' }}>Première main</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.hasCertificate || false}
              onChange={(e) => updateFilter('hasCertificate', e.target.checked || undefined)}
              style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
            />
            <span style={{ fontSize: 14, color: '#444' }}>Certificat / facture inclus</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}
