import { useState } from 'react';
import { Play, Pause, Timer as TimerIcon, X } from 'lucide-react';

// One item at a time. The processor sees the item at the head of the day's
// list — name, cases, instructions, media, timer — and a single big arrow that
// marks it done and brings up the next one. Prioritizing lives in SetupPage.
//
// Everything here is presentational: state and Firebase writes stay in App.jsx
// and arrive as props.
export default function FocusView({
  item,
  remainingCount,
  sku,
  stats,
  hasVideo,
  photo,
  noteText,
  isOos,
  timer,            // { running, paused, elapsed }
  onDone,           // marks the whole item done — all or nothing
  onToggleTimer,
  onCancelTimer,
  onWatchVideo,
  getDisplayName,
  formatTime,
  formatTimeWithUnits,
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  const timing = timer.running || timer.paused;
  const name = getDisplayName(item.name);
  const origCases = item.originalCases ?? item.cases;

  return (
    <div
      key={item.id}
      style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.18)',
        border: '2px solid transparent',
        display: 'flex',
        flexDirection: 'column',
        // Fills whatever the page leaves below the header (the page shell is
        // one viewport tall in focus mode), so the tile fits both portrait and
        // landscape without a magic header-height constant.
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        animation: 'focusTileIn 0.25s ease-out',
      }}
    >
      <style>{`@keyframes focusTileIn { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }`}</style>

      {/* Top strip: position in the day + cases */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none',
        padding: '0.9rem 1.5rem', borderBottom: '1px solid #e2e8f0', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Up now
          <span style={{ marginLeft: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'none', letterSpacing: 0 }}>
            {remainingCount === 0 ? 'Last item of the day' : `${remainingCount} more after this`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {item.carryover && (
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', background: '#dc2626', borderRadius: '6px', padding: '0.25rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>↩ From yesterday</span>
          )}
          {item.casesDone > 0 && (
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065f46', background: '#d1fae5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.25rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.casesDone} of {origCases} done</span>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', background: '#0f766e', color: 'white', borderRadius: '12px', padding: '0.35rem 1rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{item.cases}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>{item.cases === 1 ? 'case' : 'cases'}</span>
          </div>
        </div>
      </div>

      {/* Body: content on the left, big arrow on the right */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Content column scrolls on its own if an item outgrows the tile
            (long instructions, running timer + video + photo in portrait);
            the Done arrow beside it stays full height and always on screen. */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 'clamp(1.25rem, 3vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
              fontWeight: '800',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#1e293b',
              textDecoration: isOos ? 'line-through' : 'none',
              opacity: isOos ? 0.5 : 1,
              wordBreak: 'break-word',
            }}>
              {name}
            </h1>
            {item.supplier && <div style={{ marginTop: '0.4rem', fontSize: '1rem', color: '#94a3b8', fontWeight: '600' }}>{item.supplier}</div>}
            {noteText && (
              <div style={{ marginTop: '0.75rem', display: 'inline-block', fontSize: '1.1rem', color: '#92400e', background: '#fef3c7', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: '600' }}>
                📝 {noteText}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '16px',
            padding: '1.25rem 1.5rem', position: 'relative', flex: '0 1 auto',
          }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em',
              position: 'absolute', top: '-0.65rem', left: '1.25rem', background: '#fef3c7', padding: '0 0.5rem',
            }}>Instructions</span>
            <div style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: '700', color: '#78350f', lineHeight: 1.3, wordBreak: 'break-word' }}>
              {item.location || '—'}
            </div>
          </div>

          {/* Media + timer row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: 'auto', flex: 'none' }}>
            {hasVideo && (
              <button onClick={() => onWatchVideo(sku)} style={bigBtn('#059669')}>
                <Play size={26} /> Watch video
              </button>
            )}
            {photo && (
              <button onClick={() => setShowPhoto(true)} style={bigBtn('#6366f1')}>
                📷 Photo
              </button>
            )}

            {!timing ? (
              <button onClick={() => onToggleTimer(item.id)} style={{
                ...bigBtn('#fde047'), color: '#1e293b', border: '1px solid #000',
                background: 'linear-gradient(to bottom, #fef9c3, #fde047)',
                boxShadow: '0 3px 0 #a16207, 0 4px 8px rgba(0,0,0,0.15)',
              }}>
                <TimerIcon size={26} /> Timer
              </button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: timer.paused ? '#334155' : '#1e293b', border: `2px solid ${timer.paused ? '#64748b' : '#fbbf24'}`,
                borderRadius: '16px', padding: '0.6rem 1rem',
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '900', fontVariantNumeric: 'tabular-nums', color: '#fbbf24', lineHeight: 1 }}>
                  {formatTime(timer.elapsed)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>
                  <div>Per case</div>
                  <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>{formatTime(Math.floor(timer.elapsed / Math.max(1, item.cases)))}</div>
                </div>
                <button onClick={() => onToggleTimer(item.id)} aria-label={timer.paused ? 'Resume' : 'Pause'} style={{
                  background: timer.paused ? '#fbbf24' : 'transparent', color: timer.paused ? '#1e293b' : '#fbbf24',
                  border: timer.paused ? 'none' : '2px solid #fbbf24', borderRadius: '10px', padding: '0.5rem 0.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700',
                }}>
                  {timer.paused ? <><Play size={18} /> Resume</> : <><Pause size={18} /> Pause</>}
                </button>
                <button onClick={() => onCancelTimer(item.id)} aria-label="Cancel timer" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '0.3rem' }}>
                  <X size={20} />
                </button>
              </div>
            )}

            {stats && (
              <div style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: '600', background: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.25)', borderRadius: '8px', padding: '0.4rem 0.7rem', lineHeight: 1.25 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: '800' }}>{formatTimeWithUnits(stats.average)}</div>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Avg / case</div>
              </div>
            )}
          </div>
        </div>

        {/* The arrow: mark done, move on */}
        <button
          onClick={() => onDone(item)}
          aria-label="Done — next item"
          style={{
            flex: '0 0 clamp(120px, 18vw, 200px)',
            border: 'none',
            cursor: 'pointer',
            background: timing
              ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
            color: timing ? '#fbbf24' : 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="64%" viewBox="0 0 60 80" fill="none" style={{ maxWidth: '120px' }}>
            <path d="M8 8 L48 40 L8 72" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '1.3rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Done</span>
        </button>
      </div>

      {/* Photo lightbox */}
      {showPhoto && photo && (
        <div onClick={() => setShowPhoto(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '1rem',
        }}>
          <img src={photo.data} alt={name} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px' }} />
          <button onClick={() => setShowPhoto(false)} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>Close</button>
        </div>
      )}
    </div>
  );
}

const bigBtn = (bg) => ({
  background: bg, color: 'white', border: 'none', borderRadius: '14px',
  padding: '0.8rem 1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
  fontWeight: '800', fontSize: '1.15rem', WebkitTapHighlightColor: 'transparent',
});

