'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 48, textAlign: 'center', maxWidth: 448, width: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
              An unexpected error occurred. Please reload the page to continue.
            </p>
            <button
              onClick={() => reset()}
              style={{ padding: '10px 20px', borderRadius: 12, backgroundColor: '#0ea5e9', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
