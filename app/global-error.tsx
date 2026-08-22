'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f6f4ee', color: '#22262e', margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>CampusScope hit an unexpected error</h1>
          <p style={{ color: '#666', marginTop: '0.75rem' }}>Please reload the page. If it persists, come back shortly.</p>
          <button
            onClick={reset}
            style={{ marginTop: '1.25rem', padding: '0.65rem 1.25rem', border: 'none', borderRadius: 8, background: '#31386b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Reload
          </button>
          {error.digest && <p style={{ color: '#999', fontSize: '0.7rem', marginTop: '1rem' }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  )
}
