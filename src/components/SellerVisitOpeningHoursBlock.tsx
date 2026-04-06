'use client';

import { useState } from 'react';
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

export function SellerVisitOpeningHoursBlock({ hours }: Props) {
  const [weekOpen, setWeekOpen] = useState(false);
  const h = hours ?? createDefaultWeeklyOpeningHours();
  const todayId = weekdayIdFromDate(new Date());
  const todaySchedule = h[todayId];
  const todayText = formatDayScheduleFr(todaySchedule);
  const closedToday = todaySchedule.closed || todaySchedule.slots.length === 0;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 4,
          rowGap: 4,
        }}
      >
        <span style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.45 }}>
          {closedToday ? (
            "Fermé aujourd'hui"
          ) : (
            <>
              Ouvert aujourd&apos;hui
              {' : '}
              {todayText}
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setWeekOpen((v) => !v)}
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
            marginLeft: 6,
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
      </div>
      {weekOpen && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '12px 0 0',
            fontSize: 13,
            color: '#444',
            paddingTop: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {WEEKDAYS.map(({ id, labelFr }, idx) => (
            <li
              key={id}
              style={{
                display: 'grid',
                gridTemplateColumns: '5.75rem max-content',
                columnGap: 0,
                alignItems: 'baseline',
                padding: '4px 0',
                borderBottom: idx < WEEKDAYS.length - 1 ? '1px solid #f5f5f7' : 'none',
                width: 'fit-content',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span>{labelFr}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatDayScheduleFr(h[id])}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
