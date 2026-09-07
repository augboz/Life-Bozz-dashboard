/**
 * CalendarsMenu — one "Calendars" dropdown listing every source feeding the
 * grid, replacing the row of always-on account chips that ate a line of the
 * header whether or not the user cared.
 *
 * Everything about a source lives on its row: its colour (click the dot),
 * whether it shows (click the row), and removing it (subscribed links only —
 * an OAuth account is disconnected in Settings, not here, so this can't half-
 * disconnect an account). "Type classes" and "Add link" sit at the bottom,
 * since adding a calendar belongs with managing them.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Trash2, Keyboard, CalendarPlus, Layers } from 'lucide-react';
import type { Theme, CalendarFeed, CalendarNote, CalendarConnection } from '../../../lib/types';
import { feedColor } from '../../../lib/calendar';
import ColorBankPicker from '../../shared/ColorBankPicker';

interface Props {
  t: Theme;
  colorBank: string[];
  calendarFeeds: CalendarFeed[];
  onCalendarFeedsChange?: (next: CalendarFeed[]) => void;
  calendarConnections: CalendarConnection[];
  onCalendarConnectionsChange?: (next: CalendarConnection[]) => void;
  calendarNotes: CalendarNote[];
  onCalendarNotesChange?: (next: CalendarNote[]) => void;
  onTypeClasses: () => void;
  onAddLink?: () => void;
}

const CONNECTION_DEFAULT: Record<string, string> = {
  googleCalendar: '#4285F4',
  appleCalendar: '#555555',
};

export default function CalendarsMenu({
  t, colorBank,
  calendarFeeds, onCalendarFeedsChange,
  calendarConnections, onCalendarConnectionsChange,
  calendarNotes, onCalendarNotesChange,
  onTypeClasses, onAddLink,
}: Props) {
  const [open, setOpen] = useState(false);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape, so it behaves like every other menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setColorFor(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setColorFor(null); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const typedCount = calendarNotes.length;
  const sourceCount = calendarFeeds.length + calendarConnections.length + (typedCount > 0 ? 1 : 0);

  const setFeed = (id: string, patch: Partial<CalendarFeed>) => {
    onCalendarFeedsChange?.(calendarFeeds.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };
  const setConn = (conn: CalendarConnection, patch: Partial<CalendarConnection>) => {
    onCalendarConnectionsChange?.(
      calendarConnections.map(c =>
        c.email === conn.email && c.provider === conn.provider ? { ...c, ...patch } : c),
    );
  };

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    padding: '0.42rem 0.5rem', borderRadius: '8px',
    fontSize: '0.78rem', color: t.text,
  };

  const iconBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: t.textDim, padding: '2px', borderRadius: '5px', flexShrink: 0,
  };

  /** Colour dot + the inline bank picker it opens. */
  const Swatch = ({ id, color }: { id: string; color: string }) => (
    <button
      onClick={() => setColorFor(colorFor === id ? null : id)}
      title="Change colour"
      style={{
        width: 13, height: 13, minWidth: 13, borderRadius: '50%',
        background: color, boxSizing: 'content-box',
        border: colorFor === id ? `2px solid ${t.text}` : `1.5px solid ${t.border}`,
        cursor: 'pointer', padding: 0, flexShrink: 0,
      }}
    />
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setColorFor(null); }}
        title="Calendars, colours and visibility"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'transparent', border: `1px solid ${open ? t.borderStrong : t.border}`,
          borderRadius: '999px', padding: '0.32rem 0.7rem',
          color: t.text, fontFamily: 'inherit', fontSize: '0.75rem', cursor: 'pointer',
        }}
      >
        <Layers size={13} strokeWidth={1.6} />
        Calendars
        {sourceCount > 0 && (
          <span style={{ color: t.textDim, fontSize: '0.7rem' }}>{sourceCount}</span>
        )}
        <ChevronDown
          size={12}
          strokeWidth={1.8}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
            width: 300, maxHeight: '70vh', overflowY: 'auto',
            background: t.panel ?? t.bg, border: `1px solid ${t.border}`,
            borderRadius: '12px', padding: '0.4rem',
            boxShadow: '0 16px 40px rgba(0,0,0,0.30)',
          }}
        >
          {sourceCount === 0 && (
            <div style={{ padding: '0.7rem 0.6rem', fontSize: '0.76rem', color: t.textMuted, lineHeight: 1.5 }}>
              No calendars yet. Type your classes, or paste a calendar link.
            </div>
          )}

          {/* Typed events — one entry for all of them; each note keeps its own
              colour, so this recolours the whole set at once. */}
          {typedCount > 0 && (
            <>
              <div style={row}>
                <Swatch id="typed" color={calendarNotes[0]?.color ?? t.doingAccent} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Your events
                </span>
                <span style={{ fontSize: '0.7rem', color: t.textDim }}>{typedCount}</span>
              </div>
              {colorFor === 'typed' && (
                <div style={{ padding: '0.15rem 0.5rem 0.5rem 1.6rem' }}>
                  <div style={{ fontSize: '0.68rem', color: t.textDim, marginBottom: '0.3rem' }}>
                    Recolour all typed events
                  </div>
                  <ColorBankPicker
                    bank={colorBank}
                    selected={calendarNotes[0]?.color}
                    onChange={(c) => {
                      onCalendarNotesChange?.(calendarNotes.map(n => ({ ...n, color: c ?? n.color })));
                      setColorFor(null);
                    }}
                    swatchSize={16}
                  />
                </div>
              )}
            </>
          )}

          {/* Subscribed links */}
          {calendarFeeds.map((feed, i) => {
            const color = feedColor(feed, i);
            const visible = feed.enabled !== false;
            return (
              <div key={feed.id}>
                <div style={row}>
                  <Swatch id={feed.id} color={visible ? color : t.borderStrong} />
                  <button
                    onClick={() => setFeed(feed.id, { enabled: !visible })}
                    title={visible ? 'Hide from the calendar' : 'Show in the calendar'}
                    style={{
                      flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                      padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
                      color: visible ? t.text : t.textDim,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {feed.label}
                  </button>
                  <button
                    onClick={() => setFeed(feed.id, { enabled: !visible })}
                    style={iconBtn}
                    title={visible ? 'Hide' : 'Show'}
                  >
                    {visible ? <Eye size={13} strokeWidth={1.7} /> : <EyeOff size={13} strokeWidth={1.7} />}
                  </button>
                  <button
                    onClick={() => onCalendarFeedsChange?.(calendarFeeds.filter(f => f.id !== feed.id))}
                    style={iconBtn}
                    title={`Remove "${feed.label}"`}
                  >
                    <Trash2 size={13} strokeWidth={1.7} />
                  </button>
                </div>
                {colorFor === feed.id && (
                  <div style={{ padding: '0.15rem 0.5rem 0.5rem 1.6rem' }}>
                    <ColorBankPicker
                      bank={colorBank}
                      selected={feed.color}
                      onChange={(c) => { setFeed(feed.id, { color: c }); setColorFor(null); }}
                      swatchSize={16}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Connected accounts */}
          {calendarConnections.map(conn => {
            const key = `${conn.provider}:${conn.email}`;
            const color = conn.color ?? CONNECTION_DEFAULT[conn.provider] ?? '#555555';
            const label = conn.provider === 'googleCalendar' ? 'Google Calendar' : 'Apple Calendar';
            return (
              <div key={key}>
                <div style={row}>
                  <Swatch id={key} color={conn.enabled ? color : t.borderStrong} />
                  <button
                    onClick={() => setConn(conn, { enabled: !conn.enabled })}
                    title={conn.enabled ? 'Hide from the calendar' : 'Show in the calendar'}
                    style={{
                      flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                      padding: 0, cursor: 'pointer', fontFamily: 'inherit', minWidth: 0,
                      color: conn.enabled ? t.text : t.textDim,
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: t.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conn.email}
                    </div>
                  </button>
                  <button
                    onClick={() => setConn(conn, { enabled: !conn.enabled })}
                    style={iconBtn}
                    title={conn.enabled ? 'Hide' : 'Show'}
                  >
                    {conn.enabled ? <Eye size={13} strokeWidth={1.7} /> : <EyeOff size={13} strokeWidth={1.7} />}
                  </button>
                </div>
                {colorFor === key && (
                  <div style={{ padding: '0.15rem 0.5rem 0.5rem 1.6rem' }}>
                    <ColorBankPicker
                      bank={colorBank}
                      selected={conn.color}
                      onChange={(c) => { setConn(conn, { color: c }); setColorFor(null); }}
                      swatchSize={16}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ height: 1, background: t.border, margin: '0.4rem 0.2rem' }} />

          <button
            onClick={() => { setOpen(false); onTypeClasses(); }}
            style={{ ...row, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Keyboard size={13} strokeWidth={1.7} style={{ color: t.textMuted }} />
            Type classes
          </button>
          {onAddLink && (
            <button
              onClick={() => { setOpen(false); onAddLink(); }}
              style={{ ...row, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <CalendarPlus size={13} strokeWidth={1.7} style={{ color: t.textMuted }} />
              Add link
            </button>
          )}
        </div>
      )}
    </div>
  );
}
