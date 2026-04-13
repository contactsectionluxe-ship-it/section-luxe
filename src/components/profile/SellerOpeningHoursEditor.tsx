'use client';

import { useState } from 'react';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import type { WeekdayId, WeeklyOpeningHours, DaySchedule } from '@/lib/opening-hours';
import { WEEKDAYS, formatOpeningTimeTyping, finalizeOpeningTime } from '@/lib/opening-hours';
import { profilVendeurLabelStyle } from '@/components/profile/profilVendeurFormStyles';

/** Une seule case compacte « HH:MM » (le « : » est dans la valeur affichée). */
const timeCompactStyle: React.CSSProperties = {
  width: 76,
  height: 40,
  padding: '0 8px',
  fontSize: 15,
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  border: '1px solid #d2d2d7',
  borderRadius: 10,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

/** Même taille et police que « De » / « à » (ligne horaires). */
const horairesLigneLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#333',
  fontFamily: 'inherit',
};

const smallBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  padding: 0,
  border: '1px solid #d2d2d7',
  borderRadius: 10,
  backgroundColor: '#fff',
  cursor: 'pointer',
  color: '#1d1d1f',
};

type Props = {
  value: WeeklyOpeningHours;
  onChange: (next: WeeklyOpeningHours) => void;
};

export function SellerOpeningHoursEditor({ value, onChange }: Props) {
  const [horairesOpen, setHorairesOpen] = useState(false);

  const patchDay = (day: WeekdayId, next: DaySchedule) => {
    onChange({ ...value, [day]: next });
  };

  const setClosed = (day: WeekdayId, closed: boolean) => {
    const cur = value[day];
    if (closed) {
      patchDay(day, { closed: true, slots: [] });
      return;
    }
    const slots =
      cur.slots.length > 0
        ? cur.slots.map((s) => ({
            open: s.open || '09:00',
            close: s.close || '18:00',
          }))
        : [{ open: '09:00', close: '18:00' }];
    patchDay(day, { closed: false, slots });
  };

  const setSlotTime = (day: WeekdayId, index: number, field: 'open' | 'close', t: string) => {
    const cur = value[day];
    const slots = cur.slots.map((s, i) => (i === index ? { ...s, [field]: t } : s));
    patchDay(day, { ...cur, closed: false, slots });
  };

  const addSlot = (day: WeekdayId) => {
    const cur = value[day];
    if (cur.closed || cur.slots.length >= 2) return;
    if (cur.slots.length === 0) {
      patchDay(day, { closed: false, slots: [{ open: '09:00', close: '18:00' }] });
      return;
    }
    patchDay(day, {
      closed: false,
      slots: [...cur.slots, { open: '14:00', close: '19:00' }],
    });
  };

  const removeLastSlot = (day: WeekdayId) => {
    const cur = value[day];
    if (cur.slots.length <= 1) return;
    patchDay(day, { ...cur, slots: cur.slots.slice(0, 1) });
  };

  return (
    <div className="seller-opening-hours-editor" style={{ marginTop: 0, fontFamily: 'inherit' }}>
      <button
        type="button"
        onClick={() => setHorairesOpen((o) => !o)}
        aria-expanded={horairesOpen}
        aria-controls="seller-opening-hours-panel"
        id="seller-opening-hours-toggle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          maxWidth: '100%',
          minHeight: 0,
          padding: 0,
          marginBottom: 8,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
      >
        <span style={{ ...profilVendeurLabelStyle, marginBottom: 0 }}>
          Horaires d&apos;ouverture
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          color="#333"
          aria-hidden
          style={{
            flexShrink: 0,
            transform: horairesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
      {horairesOpen && (
      <div id="seller-opening-hours-panel" role="region" aria-labelledby="seller-opening-hours-toggle" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {WEEKDAYS.map(({ id: day, labelFr }, dayIndex) => {
          const row = value[day];
          const closed = row.closed;
          const slots = closed ? [] : row.slots;
          const isLastDay = dayIndex === WEEKDAYS.length - 1;

          return (
            <div
              key={day}
              style={{
                borderBottom: isLastDay ? 'none' : '1px solid #f0f0f2',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                padding: '10px 0',
              }}
            >
              <div
                className="seller-opening-hours-ferme-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className="seller-opening-hours-day-label"
                  style={{
                    ...horairesLigneLabelStyle,
                    width: 100,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {labelFr}
                </span>
                <label
                  className="seller-opening-hours-ferme-label"
                  style={{
                    ...horairesLigneLabelStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    userSelect: 'none',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={(e) => setClosed(day, e.target.checked)}
                    style={{
                      width: 13,
                      height: 13,
                      margin: 0,
                      flexShrink: 0,
                      accentColor: '#1d1d1f',
                    }}
                  />
                  Fermé
                </label>
              </div>
              {!closed && (
                <div
                  className="seller-opening-hours-slots-outer"
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span className="seller-opening-hours-spacer" style={{ width: 100, flexShrink: 0 }} aria-hidden />
                  <div
                    className="seller-opening-hours-slots-column"
                    style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {slots.map((slot, i) => (
                      <div
                        key={i}
                        className={i === 0 ? 'seller-opening-hours-slot-row seller-opening-hours-slot-row--first' : 'seller-opening-hours-slot-row seller-opening-hours-slot-row--second'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className="seller-opening-hours-de" style={{ ...horairesLigneLabelStyle, width: 22 }}>
                          De
                        </span>
                        <input
                          className="seller-opening-hours-time-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={5}
                          placeholder="..:.."
                          value={slot.open}
                          onChange={(e) => setSlotTime(day, i, 'open', formatOpeningTimeTyping(e.target.value))}
                          onBlur={(e) => setSlotTime(day, i, 'open', finalizeOpeningTime(e.target.value))}
                          style={timeCompactStyle}
                          aria-label={`Ouverture ${labelFr} début`}
                        />
                        <span className="seller-opening-hours-a" style={horairesLigneLabelStyle}>
                          à
                        </span>
                        <span
                          className="seller-opening-hours-close-plus-wrap"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <input
                            className="seller-opening-hours-time-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={5}
                            placeholder="..:.."
                            value={slot.close}
                            onChange={(e) => setSlotTime(day, i, 'close', formatOpeningTimeTyping(e.target.value))}
                            onBlur={(e) => setSlotTime(day, i, 'close', finalizeOpeningTime(e.target.value))}
                            style={timeCompactStyle}
                            aria-label={`Ouverture ${labelFr} fin`}
                          />
                          {i === row.slots.length - 1 && row.slots.length < 2 && (
                            <button
                              type="button"
                              className="seller-opening-hours-add-btn"
                              onClick={() => addSlot(day)}
                              style={smallBtn}
                              title="Ajouter une 2ᵉ plage le même jour"
                              aria-label="Ajouter une plage horaire"
                            >
                              <Plus size={18} strokeWidth={2} />
                            </button>
                          )}
                          {i === 0 && row.slots.length === 2 && (
                            <span
                              className="seller-opening-hours-amp-sep"
                              style={{
                                ...horairesLigneLabelStyle,
                                fontSize: 14,
                                width: 40,
                                minWidth: 40,
                                height: 40,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                userSelect: 'none',
                              }}
                              aria-hidden
                            >
                              &
                            </span>
                          )}
                        </span>
                        {i === 1 && (
                          <button
                            type="button"
                            className="seller-opening-hours-remove-btn"
                            onClick={() => removeLastSlot(day)}
                            style={smallBtn}
                            title="Retirer la 2ᵉ plage"
                            aria-label="Retirer la deuxième plage horaire"
                          >
                            <Minus size={18} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
