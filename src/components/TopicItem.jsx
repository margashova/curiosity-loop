import { useState, useRef, useEffect } from 'react'

const CATEGORY_COLORS = {
  wine:    '#C4603A',
  design:  '#7B5EA7',
  science: '#7A8C6E',
  culture: '#C4933A',
}

export default function TopicItem({ topic, onPause, onResume, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(topic.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleRenameSubmit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== topic.name) onRename(topic.id, trimmed)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') { setDraft(topic.name); setEditing(false) }
  }

  const stripe = CATEGORY_COLORS[topic.category] || 'var(--ink3)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--cream2)', borderRadius: '14px', border: '0.5px solid var(--border)' }}>
      <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: stripe, flexShrink: 0, minHeight: '32px' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', background: 'var(--cream)', border: '0.5px solid var(--border2)', borderRadius: '8px', padding: '4px 8px', fontSize: '14px', color: 'var(--ink)', outline: 'none' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              onClick={() => { setDraft(topic.name); setEditing(true) }}
              style={{ fontSize: '14px', color: topic.paused ? 'var(--ink3)' : 'var(--ink)', fontStyle: topic.paused ? 'italic' : 'normal', cursor: 'text', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {topic.name}
            </span>
            {topic.paused && (
              <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink4)', background: 'var(--cream3)', padding: '2px 6px', borderRadius: '6px', flexShrink: 0 }}>
                paused
              </span>
            )}
          </div>
        )}
        {topic.fact_count != null && (
          <span style={{ fontSize: '12px', color: 'var(--ink4)' }}>{topic.fact_count} {topic.fact_count === 1 ? 'fact' : 'facts'}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <IconBtn title="Rename" onClick={() => { setDraft(topic.name); setEditing(true) }}>✏️</IconBtn>
        {topic.paused
          ? <IconBtn title="Resume" onClick={() => onResume(topic.id)}>▶️</IconBtn>
          : <IconBtn title="Pause" onClick={() => onPause(topic.id)}>⏸️</IconBtn>
        }
        <IconBtn title="Remove" onClick={() => onDelete(topic.id)} danger>🗑️</IconBtn>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: danger ? 'transparent' : 'transparent', opacity: 0.7, transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
    >
      {children}
    </button>
  )
}
