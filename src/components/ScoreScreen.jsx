const CATEGORY_COLORS = {
  wine:    '#C4603A',
  design:  '#7B5EA7',
  science: '#7A8C6E',
  culture: '#C4933A',
}

export default function ScoreScreen({ questions, answers, onRetry }) {
  const correct = answers.filter((a, i) => a === questions[i].correct_index).length
  const total = questions.length
  const pct = total > 0 ? correct / total : 0

  // Per-topic breakdown
  const topicMap = {}
  questions.forEach((q, i) => {
    const key = q.topic_name || 'Unknown'
    if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, category: q.category }
    topicMap[key].total++
    if (answers[i] === q.correct_index) topicMap[key].correct++
  })

  // SVG ring
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '8px 0 24px' }}>
      {/* Circle */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="132" height="132" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="66" cy="66" r={r} fill="none" stroke="var(--cream3)" strokeWidth="8" />
          <circle
            cx="66" cy="66" r={r}
            fill="none"
            stroke="var(--terra)"
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1 }}>
            {correct}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '2px' }}>of {total}</div>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '12px' }}>
          By topic
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(topicMap).map(([name, { correct: c, total: t, category }]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--cream2)', borderRadius: '12px', border: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: CATEGORY_COLORS[category] || 'var(--ink3)', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: 'var(--ink)' }}>{name}</span>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--ink3)', fontVariantNumeric: 'tabular-nums' }}>{c}/{t}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRetry}
        style={{ padding: '12px 32px', background: 'var(--terra)', color: '#FFF8F5', borderRadius: '12px', fontSize: '15px', fontWeight: '500' }}
      >
        Try again
      </button>
    </div>
  )
}
