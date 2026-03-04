'use client';

import Link from 'next/link';

export interface CguCgvCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id?: string;
}

export function CguCgvCheckbox({ checked, onChange, error, id = 'cgu-cgv' }: CguCgvCheckboxProps) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${error ? '#fecaca' : '#e8e8ed'}`,
        backgroundColor: error ? '#fef2f2' : 'transparent',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
      }}
    >
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1.45,
          color: '#6e6e73',
        }}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          style={{
            width: 16,
            height: 16,
            marginTop: 1,
            flexShrink: 0,
            accentColor: '#1d1d1f',
            cursor: 'pointer',
          }}
        />
        <span>
          J&apos;ai pris connaissance des{' '}
          <Link
            href="/cgu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#6e6e73',
              fontWeight: 500,
              textDecoration: 'underline',
              textUnderlineOffset: 1,
            }}
          >
            Conditions Générales d&apos;Utilisation
          </Link>
          {' '}et des{' '}
          <Link
            href="/cgv"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#6e6e73',
              fontWeight: 500,
              textDecoration: 'underline',
              textUnderlineOffset: 1,
            }}
          >
            Conditions Générales de Vente
          </Link>
          {' '}et les accepte.
        </span>
      </label>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          style={{
            marginTop: 6,
            marginBottom: 0,
            marginLeft: 26,
            fontSize: 11,
            color: '#dc2626',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
