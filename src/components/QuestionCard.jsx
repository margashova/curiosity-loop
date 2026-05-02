const LABELS = ['A', 'B', 'C', 'D']

export default function QuestionCard({ question, options, selectedIndex, correctIndex, onSelect }) {
  const answered = selectedIndex !== null && selectedIndex !== undefined

  function getOptionStyle(i) {
    const base = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      width: '100%',
      padding: '13px 16px',
      borderRadius: '14px',
      border: '0.5px solid var(--border)',
      background: 'var(--cream2)',
      color: 'var(--ink)',
      fontSize: '14px',
      lineHeight: '1.5',
      textAlign: 'left',
      cursor: answered ? 'default' : 'pointer',
      transition: 'border-color 0.15s, background 0.15s',
    }
    if (!answered) return base
    if (i === correctIndex) {
      return { ...base, background: 'var(--sage-faint)', border: '0.5px solid var(--sage)', color: 'var(--ink)' }
    }
    if (i === selectedIndex) {
      return { ...base, background: 'var(--terra-faint)', border: '0.5px solid var(--terra)', color: 'var(--ink)' }
    }
    return { ...base, opacity: 0.5 }
  }

  function getLabelStyle(i) {
    const base = {
      flexShrink: 0,
      width: '22px',
      height: '22px',
      borderRadius: '6px',
      border: '0.5px solid var(--border2)',
      background: 'var(--cream3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '600',
      color: 'var(--ink3)',
      lineHeight: 1,
    }
    if (!answered) return base
    if (i === correctIndex) return { ...base, background: 'var(--sage)', border: 'none', color: '#fff' }
    if (i === selectedIndex) return { ...base, background: 'var(--terra)', border: 'none', color: '#fff' }
    return base
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', lineHeight: '1.6', color: 'var(--ink)', marginBottom: '4px' }}>
        {question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {options.map((opt, i) => (
          <button
            key={i}
            style={getOptionStyle(i)}
            onClick={() => !answered && onSelect(i)}
            disabled={answered}
          >
            <span style={getLabelStyle(i)}>{LABELS[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
