'use client'

import { useEffect } from 'react'

// Root-level error boundary. Unlike app/error.tsx this catches throws in
// the root layout itself. It replaces the whole document, so globals.css
// is NOT applied — use inline styles only and no project imports.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled root error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#020617',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            textAlign: 'center',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 24,
            padding: 32,
          }}
        >
          <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
            We hit an unexpected server error. Please try again in a moment.
          </p>
          {error?.digest && (
            <p style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: '#1e293b',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
