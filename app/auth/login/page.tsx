'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AuthLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Incorrect password.')
        setLoading(false)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', padding: '24px' }}>
      <section style={{ width: '100%', maxWidth: '440px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Image src="/sui-logo.png" alt="Sui logo" width={34} height={34} unoptimized priority />
          </div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
            Protected Access
          </p>
          <h1 style={{ fontSize: '30px', lineHeight: 1.1, fontWeight: 800, color: '#cfd5dd', marginBottom: '8px' }}>
            Sign In to Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
            Enter your password to continue.
          </p>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #1e293b', background: '#020617', color: '#cfd5dd', fontSize: '14px', marginBottom: '12px', outline: 'none' }}
          />

          {error && (
            <p style={{ fontSize: '12px', color: '#e11d48', marginBottom: '12px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: '100%', padding: '11px 16px', borderRadius: '12px', border: 'none', background: loading || !password ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Enter Dashboard'}
          </button>
        </form>
      </section>
    </main>
  )
}
