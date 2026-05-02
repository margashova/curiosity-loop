import { useState } from 'react'

const CATEGORIES = ['wine', 'design', 'science', 'culture']

export default function AddTopicForm({ onAdd }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('wine')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    await onAdd(trimmed, category)
    setName('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New topic…"
        required
        style={{ flex: 1, minWidth: '160px', padding: '10px 14px', background: 'var(--cream2)', border: '0.5px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--ink)', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = 'var(--border2)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{ padding: '10px 14px', background: 'var(--cream2)', border: '0.5px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--ink)', outline: 'none', cursor: 'pointer' }}
      >
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{ padding: '10px 20px', background: 'var(--terra)', color: '#FFF8F5', borderRadius: '12px', fontSize: '14px', fontWeight: '500', opacity: loading || !name.trim() ? 0.5 : 1, transition: 'opacity 0.15s' }}
      >
        {loading ? 'Adding…' : 'Add topic'}
      </button>
    </form>
  )
}
