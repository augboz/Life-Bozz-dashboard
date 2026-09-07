/**
 * EventDetailPopover — the full story of one event, on click.
 *
 * Grid blocks are sized by duration and column count, so a short or narrow one
 * truncates its title to a few characters and there was no way to find out what
 * it actually said. Everything the app knows about an event lives here instead:
 * the untruncated title, its date and times, where it is, any description, and
 * which calendar it came from.
 *
 * Anchored to the click and clamped to the viewport, so it opens next to the
 * event rather than in the middle of the screen, and never off the edge.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { X, Clock, MapPin, Calendar as CalendarIcon, Trash2, AlignLeft } from 'lucide-react';
import type { CalendarEvent, Theme } from '../../../lib/types';

const WIDTH = 280;
const MARGIN = 10;

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  const start = event.startMin != null
    ? `${String(Math.floor(event.startMin / 60)).padStart(2, '0')}:${String(event.startMin % 60).padStart(2, '0')}`
    : format(new Date(event.start), 'HH:mm');
  const end = event.endMin != null
    ? `${String(Math.floor(event.endMin / 60)).padStart(2, '0')}:${String(event.endMin % 60).padStart(2, '0')}`
    : event.end ? format(new Date(event.end), 'HH:mm') : null;
  return end ? `${start} - ${end}` : start;
}

export default function EventDetailPopover({
  event, anchor, t, sourceLabel, onClose, onDelete,
}: {
  event: CalendarEvent;
  anchor: { x: number; y: number };
  t: Theme;
  /** Which calendar this came from, e.g. a feed's name. */
  sourceLabel?: string;
  onClose: () => void;
  /** Only provided for events the user owns (typed/created), which can be deleted. */
  onDelete?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: anchor.x, top: anchor.y });

  // Place it next to the click, then pull it back inside the window. Measured
  // after paint so the height used is the real one, not a guess.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 200;
    const left = Math.min(Math.max(MARGIN, anchor.x + 8), window.innerWidth - WIDTH - MARGIN);
    const top = Math.min(Math.max(MARGIN, anchor.y + 8), window.innerHeight - h - MARGIN);
    setPos({ left, top });
  }, [anchor.x, anchor.y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Deferred: the click that opened this popover is still propagating.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const metaRow: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
    fontSize: '0.75rem', color: t.textMuted, lineHeight: 1.5,
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={event.title}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', left: pos.left, top: pos.top, zIndex: 200,
        width: WIDTH, maxHeight: '70vh', overflowY: 'auto',
        background: t.panel ?? t.bg,
        border: `1px solid ${t.border}`,
        borderLeft: `4px solid ${event.color}`,
        borderRadius: '12px',
        padding: '0.85rem 0.9rem',
        boxShadow: '0 18px 46px rgba(0,0,0,0.38)',
        fontFamily: 'var(--app-font, system-ui)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
        {/* Full title, wrapped — the whole point of this popover. */}
        <div style={{
          flex: 1, fontSize: '0.92rem', fontWeight: 600, color: t.text,
          lineHeight: 1.35, wordBreak: 'break-word',
        }}>
          {event.title}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: t.textDim, padding: 2, flexShrink: 0, borderRadius: 5,
          }}
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={metaRow}>
          <CalendarIcon size={13} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{format(new Date(event.start), 'EEEE d MMMM yyyy')}</span>
        </div>
        <div style={metaRow}>
          <Clock size={13} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{timeLabel(event)}</span>
        </div>
        {event.location && (
          <div style={metaRow}>
            <MapPin size={13} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ wordBreak: 'break-word' }}>{event.location}</span>
          </div>
        )}
        {event.description && (
          <div style={metaRow}>
            <AlignLeft size={13} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {event.description.length > 600
                ? `${event.description.slice(0, 600)}…`
                : event.description}
            </span>
          </div>
        )}
      </div>

      {(sourceLabel || onDelete) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.6rem',
          borderTop: `1px solid ${t.border}`,
        }}>
          {sourceLabel ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.68rem', color: t.textDim, minWidth: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: event.color, flexShrink: 0,
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sourceLabel}
              </span>
            </span>
          ) : <span />}
          {onDelete && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              title="Delete this event"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'transparent', border: `1px solid ${t.border}`,
                borderRadius: '999px', padding: '0.25rem 0.6rem',
                color: t.textMuted, fontFamily: 'inherit', fontSize: '0.7rem',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Trash2 size={11} strokeWidth={1.8} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
