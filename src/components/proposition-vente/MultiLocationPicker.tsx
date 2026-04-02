'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { SaleProposalLocationEntry } from '@/lib/saleProposalLocations';
import { useCatalogueLocationSuggestions, RADIUS_KM_OPTIONS } from '@/hooks/useCatalogueLocationSuggestions';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  color: '#333',
};

export function MultiLocationPicker({
  selected,
  onChange,
  radiusKm,
  onRadiusKmChange,
  geoError,
  geoLoading,
  onRequestGeolocation,
  onClearGeolocation,
}: {
  selected: SaleProposalLocationEntry[];
  onChange: (next: SaleProposalLocationEntry[]) => void;
  radiusKm: number;
  onRadiusKmChange: (km: number) => void;
  geoError: string | null;
  geoLoading: boolean;
  onRequestGeolocation: () => void;
  onClearGeolocation: () => void;
}) {
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const { suggestions: locationSuggestions, cityLoading: locationCityLoading } =
    useCatalogueLocationSuggestions(locationQuery);

  const addEntry = (e: { label: string; prefixes: string[] }) => {
    const exists = selected.some((x) => x.label === e.label);
    if (!exists) onChange([...selected, { label: e.label, prefixes: e.prefixes }]);
    setLocationQuery('');
    setLocationSuggestionsOpen(false);
    onRadiusKmChange(0);
    onClearGeolocation();
  };

  const removeAt = (idx: number) => {
    onChange(selected.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={labelStyle}>
        Trouver des vendeurs selon la localisation <span style={{ color: '#1d1d1f' }}>*</span>
      </label>

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map((loc, idx) => (
            <span
              key={`${loc.label}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                backgroundColor: '#f5f5f7',
                borderRadius: 8,
                fontSize: 13,
                color: '#1d1d1f',
              }}
            >
              {loc.label}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={`Retirer ${loc.label}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6e6e73', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setLocationSuggestionsOpen(true);
            }}
            onFocus={() =>
              setLocationSuggestionsOpen(
                locationQuery.trim().length > 0 || locationSuggestions.length > 0
              )
            }
            placeholder="Ville, code postal, région…"
            autoComplete="off"
            style={{
              flex: 1,
              width: '100%',
              height: 50,
              padding: '0 16px',
              fontSize: 15,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {locationSuggestionsOpen && (locationSuggestions.length > 0 || locationCityLoading) && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '100%',
                marginTop: 4,
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
                borderRadius: 8,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 20,
                maxHeight: 'min(400px, 60vh)',
                overflowY: 'auto',
              }}
            >
              {locationCityLoading && locationSuggestions.length === 0 ? (
                <div style={{ padding: '12px 12px', fontSize: 13, color: '#6e6e73' }}>Recherche en cours…</div>
              ) : (
                locationSuggestions.map((s, si) => (
                  <button
                    key={`${s.type}-${s.label}-${si}`}
                    type="button"
                    onClick={() => addEntry({ label: s.label, prefixes: s.prefixes })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 14,
                      color: '#1d1d1f',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    {s.label}
                  </button>
                ))
              )}
            </div>
          )}
      </div>

      <div style={{ marginTop: 15, marginBottom: 0 }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            input.proposition-radius-slider { -webkit-appearance: none; appearance: none; background: transparent; }
            input.proposition-radius-slider::-webkit-slider-runnable-track {
              height: 8px; border-radius: 4px; background: linear-gradient(to right, #1d1d1f 0%, #1d1d1f var(--fill, 0%), #f5f5f5 var(--fill, 0%), #f5f5f5 100%);
              border: 1px solid #e0e0e0;
            }
            input.proposition-radius-slider::-webkit-slider-thumb {
              -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
              background: #1d1d1f; cursor: pointer; margin-top: -5px; border: none;
            }
            input.proposition-radius-slider::-moz-range-track {
              height: 8px; border-radius: 4px; background: linear-gradient(to right, #1d1d1f 0%, #1d1d1f var(--fill, 0%), #f5f5f5 var(--fill, 0%), #f5f5f5 100%);
              border: 1px solid #e0e0e0;
            }
            input.proposition-radius-slider::-moz-range-thumb {
              width: 18px; height: 18px; border-radius: 50%; background: #1d1d1f; cursor: pointer; border: none;
            }
          `,
          }}
        />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>Ou dans un rayon de (km)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="proposition-radius-slider"
            type="range"
            min={0}
            max={RADIUS_KM_OPTIONS.length}
            step={1}
            value={
              radiusKm === 0
                ? 0
                : RADIUS_KM_OPTIONS.indexOf(radiusKm) >= 0
                  ? RADIUS_KM_OPTIONS.indexOf(radiusKm) + 1
                  : 1
            }
            onChange={(e) => {
              const idx = Number(e.target.value);
              const nextKm = idx === 0 ? 0 : RADIUS_KM_OPTIONS[idx - 1] ?? 5;
              onRadiusKmChange(nextKm);
              if (nextKm > 0) {
                onChange([]);
                setLocationQuery('');
                setLocationSuggestionsOpen(false);
                onRequestGeolocation();
              } else {
                onClearGeolocation();
              }
            }}
            aria-label="Rayon en kilomètres autour de ma position"
            style={{
              flex: '1 1 120px',
              minWidth: 120,
              height: 8,
              ['--fill' as string]: `${
                radiusKm === 0
                  ? 0
                  : ((RADIUS_KM_OPTIONS.indexOf(radiusKm) >= 0 ? RADIUS_KM_OPTIONS.indexOf(radiusKm) + 1 : 1) /
                      RADIUS_KM_OPTIONS.length) *
                    100
              }%`,
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', minWidth: 48 }}>
            {geoLoading ? '…' : radiusKm === 0 ? '— —' : `${radiusKm} km`}
          </span>
        </div>
        {geoError && radiusKm > 0 && (
          <p style={{ fontSize: 13, color: '#b45309', marginTop: 10, marginBottom: 0 }}>{geoError}</p>
        )}
      </div>
    </div>
  );
}
