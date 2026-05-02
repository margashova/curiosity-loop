export default function NotConfigured() {
  return (
    <div style={{ maxWidth: '480px', margin: '48px auto', padding: '0 20px' }}>
      <div style={{ background: 'var(--cream2)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '28px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--terra)', marginBottom: '10px' }}>
          Setup needed
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--ink)', marginBottom: '12px' }}>
          Connect your Supabase project
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '20px' }}>
          Copy <code style={{ background: 'var(--cream3)', padding: '1px 6px', borderRadius: '4px', fontSize: '13px' }}>.env.example</code> to <code style={{ background: 'var(--cream3)', padding: '1px 6px', borderRadius: '4px', fontSize: '13px' }}>.env</code> and fill in your keys from Supabase → Project Settings → API.
        </p>
        <div style={{ background: 'var(--cream3)', borderRadius: '12px', padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.8' }}>
          <div><span style={{ color: 'var(--ink4)' }}># .env</span></div>
          <div>VITE_SUPABASE_URL=<span style={{ color: 'var(--terra)' }}>your-project-url</span></div>
          <div>VITE_SUPABASE_ANON_KEY=<span style={{ color: 'var(--terra)' }}>your-anon-key</span></div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '16px' }}>
          After adding the keys, restart the dev server.
        </p>
      </div>
    </div>
  )
}
