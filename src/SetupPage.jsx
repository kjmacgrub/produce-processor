import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Plus, Trash2, RotateCcw, Pencil } from 'lucide-react';

// The supervisor's page: put the day's list in order before the store opens,
// pull items that were shorted, add ad-hoc ones, restore anything pulled by
// mistake. Opened from the hamburger menu; the processor's FocusView just
// walks the order decided here.
export default function SetupPage({
  items,            // already sorted
  removedItems,     // completedItems flagged removed: true
  dateLabel,
  onClose,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onMoveBottom,
  onRemove,
  onRestore,
  onAddItem,
  onUpdateLocation,
  getDisplayName,
  carryoverCount = 0,
  onReviewCarryover,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const commitEdit = (id) => { onUpdateLocation(id, editText.trim()); setEditingId(null); };
  const totalCases = items.reduce((s, i) => s + (i.cases || 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900, background: '#f5f5f7', overflowY: 'auto',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0.9rem clamp(0.75rem, 3vw, 2rem)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Set up today's list</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', marginTop: '0.2rem' }}>
            {dateLabel} · {items.length} item{items.length === 1 ? '' : 's'} · {totalCases} cases
          </div>
        </div>
        <button onClick={onAddItem} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: '#0f766e',
          border: '2px solid #0f766e', borderRadius: '12px', padding: '0.6rem 1rem', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
        }}>
          <Plus size={20} /> Add item
        </button>
        <button onClick={onClose} style={{
          background: '#0f766e', color: 'white', border: 'none', borderRadius: '12px',
          padding: '0.65rem 1.4rem', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer',
        }}>
          Done → start processing
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(0.75rem, 3vw, 2rem)', display: 'grid', gap: '0.6rem' }}>
        {carryoverCount > 0 && (
          <button onClick={onReviewCarryover} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            background: '#1a1a1a', color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '14px',
            padding: '0.9rem 1.25rem', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', textAlign: 'left', marginBottom: '0.4rem',
          }}>
            <span>{carryoverCount} unfinished item{carryoverCount === 1 ? '' : 's'} from yesterday</span>
            <span style={{ textDecoration: 'underline', fontWeight: '700' }}>Carry over or archive →</span>
          </button>
        )}
        {items.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Nothing on the list. Add an item, or restore one below.
          </div>
        )}

        {items.map((item, idx) => {
          const first = idx === 0, last = idx === items.length - 1;
          const name = getDisplayName(item.name);
          return (
            <div key={item.id} style={{
              background: 'white', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'stretch', overflow: 'hidden',
              border: first ? '2px solid #0f766e' : '2px solid transparent',
            }}>
              {/* Position */}
              <div style={{
                flex: '0 0 3.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: first ? '#0f766e' : '#f1f5f9', color: first ? 'white' : '#64748b',
                fontSize: '1.3rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums',
              }}>
                {idx + 1}
              </div>

              {/* Reorder */}
              <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '0.4rem', alignContent: 'center' }}>
                <IconBtn title="Move to top" disabled={first} onClick={() => onMoveTop(item.id)}><ArrowUpToLine size={20} /></IconBtn>
                <IconBtn title="Move up" disabled={first} onClick={() => onMoveUp(item.id)}><ArrowUp size={20} /></IconBtn>
                <IconBtn title="Move to bottom" disabled={last} onClick={() => onMoveBottom(item.id)}><ArrowDownToLine size={20} /></IconBtn>
                <IconBtn title="Move down" disabled={last} onClick={() => onMoveDown(item.id)}><ArrowDown size={20} /></IconBtn>
              </div>

              {/* Name + instructions */}
              <div style={{ flex: 1, minWidth: 0, padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>{name}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white', background: '#0f766e', borderRadius: '6px', padding: '0.15rem 0.55rem' }}>
                    {item.cases} {item.cases === 1 ? 'case' : 'cases'}
                  </span>
                  {item.carryover && <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fff', background: '#dc2626', borderRadius: '4px', padding: '0.15rem 0.45rem', textTransform: 'uppercase' }}>From yesterday</span>}
                  {item.casesDone > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#065f46', background: '#d1fae5', borderRadius: '4px', padding: '0.15rem 0.45rem' }}>{item.casesDone} of {item.originalCases} done</span>}
                </div>
                {editingId === item.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => commitEdit(item.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(item.id); else if (e.key === 'Escape') setEditingId(null); }}
                    style={{ fontSize: '1rem', fontWeight: '600', color: '#78350f', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '6px', padding: '0.3rem 0.5rem', outline: 'none' }}
                  />
                ) : (
                  <div
                    onClick={() => { setEditingId(item.id); setEditText(item.location || ''); }}
                    style={{ fontSize: '1rem', fontWeight: '600', color: '#78350f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-word' }}
                  >
                    <span>{item.location || <em style={{ color: '#94a3b8' }}>no instructions</em>}</span>
                    <Pencil size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                  </div>
                )}
              </div>

              {/* Remove */}
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '0.4rem' }}>
                {confirmId === item.id ? (
                  <>
                    <button onClick={() => { onRemove(item); setConfirmId(null); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '0.55rem 0.9rem', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Remove
                    </button>
                    <button onClick={() => setConfirmId(null)} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}>Keep</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmId(item.id)} title="Take off today's list" style={{
                    background: 'transparent', color: '#94a3b8', border: '2px solid #e2e8f0', borderRadius: '10px',
                    padding: '0.5rem', cursor: 'pointer', display: 'flex',
                  }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {removedItems.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Taken off today's list ({removedItems.length})
            </div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {removedItems.map((item) => (
                <div key={item.id} style={{
                  background: 'white', borderRadius: '12px', padding: '0.5rem 0.75rem', opacity: 0.8,
                  display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px dashed #cbd5e1',
                }}>
                  <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: '700', color: '#64748b', textDecoration: 'line-through' }}>{getDisplayName(item.name)}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}>{item.cases} {item.cases === 1 ? 'case' : 'cases'}</span>
                  <button onClick={() => onRestore(item)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white', color: '#0f766e',
                    border: '2px solid #0f766e', borderRadius: '10px', padding: '0.4rem 0.8rem', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                  }}>
                    <RotateCcw size={16} /> Put back
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, disabled, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '2.4rem', height: '2.4rem', borderRadius: '8px', border: 'none',
        background: disabled ? 'transparent' : '#f1f5f9', color: disabled ? '#e2e8f0' : '#334155',
        cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
