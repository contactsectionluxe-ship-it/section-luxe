'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  WEEKDAYS,
  createDefaultWeeklyOpeningHours,
  formatDayScheduleFr,
  weekdayIdFromDate,
  type WeeklyOpeningHours,
} from '@/lib/opening-hours';

type Props = {
  hours?: WeeklyOpeningHours | null;
};

function OpeningHoursChevronButton({ weekOpen, onToggle }: { weekOpen: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={weekOpen}
      aria-label={weekOpen ? 'Masquer les horaires de la semaine' : 'Afficher les horaires de la semaine'}
      title="Horaires de la semaine"
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'transparent',
        padding: 2,
        margin: 0,
        cursor: 'pointer',
        color: '#444',
        lineHeight: 0,
      }}
    >
      <ChevronDown
        size={16}
        strokeWidth={2}
        style={{
          transform: weekOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}
        aria-hidden
      />
    </button>
  );
}

export function SellerVisitOpeningHoursBlock({ hours }: Props) {
  const [weekOpen, setWeekOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const h = hours ?? createDefaultWeeklyOpeningHours();
  const todayId = weekdayIdFromDate(new Date());
  const todaySchedule = h[todayId];
  const todayText = formatDayScheduleFr(todaySchedule);
  const closedToday = todaySchedule.closed || todaySchedule.slots.length === 0;

  /** Après l’animation d’ouverture, recaler le scroll de la popup (évite un bloc tronqué ou un saut visuel). */
  useLayoutEffect(() => {
    if (!weekOpen) return;
    const el = detailsRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }, 340);
    return () => window.clearTimeout(t);
  }, [weekOpen]);

  return (
    <div style={{ marginBottom: 12, contain: 'layout' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 4,
          rowGap: 4,
        }}
      >
        {closedToday ? (
          <span
            style={{
              display: 'inline-flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <span style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.45 }}>Fermé aujourd&apos;hui</span>
            <OpeningHoursChevronButton weekOpen={weekOpen} onToggle={() => setWeekOpen((v) => !v)} />
          </span>
        ) : (
          <>
            <span style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.45 }}>Ouvert aujourd&apos;hui : </span>
            <span
              style={{
                display: 'inline-flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
                flex: '1 1 auto',
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarGutter: 'stable',
              }}
            >
              <span
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#444',
                  lineHeight: 1.45,
                  whiteSpace: 'nowrap',
                }}
              >
                {todayText}
              </span>
              <OpeningHoursChevronButton weekOpen={weekOpen} onToggle={() => setWeekOpen((v) => !v)} />
            </span>
          </>
        )}
      </div>
      {/*
        Grille 0fr → 1fr : ouverture fluide sans apparition brutale (moins de bug visuel dans la popup max-height + scroll).
        Le contenu reste monté dans le DOM pour une mise en page stable (pas de recalcul max-content au premier paint).
      */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: weekOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.32s ease-out',
        }}
      >
        <div
          ref={detailsRef}
          style={{
            overflow: 'hidden',
            minHeight: 0,
          }}
          {...(!weekOpen ? { 'aria-hidden': true as const } : {})}
        >
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '12px 0 0',
              fontSize: 13,
              color: '#444',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {WEEKDAYS.map(({ id, labelFr }, idx) => (
              <li
                key={id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(5.5rem, 6.25rem) minmax(0, 1fr)',
                  columnGap: 10,
                  alignItems: 'baseline',
                  padding: '5px 0',
                  borderBottom: idx < WEEKDAYS.length - 1 ? '1px solid #f5f5f7' : 'none',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ flexShrink: 0 }}>{labelFr}</span>
                <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatDayScheduleFr(h[id])}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
