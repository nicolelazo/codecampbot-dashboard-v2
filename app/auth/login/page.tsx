'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AuthLoginPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [focused, setFocused]     = useState(false)
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/login', {
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
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#020617',
      padding: isMobile ? '16px' : '24px',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.12), transparent)',
    }}>
      <section style={{
        width: '100%',
        maxWidth: '420px',
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: isMobile ? '20px' : '28px',
        padding: isMobile ? '28px 20px' : '36px 32px',
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: isMobile ? '24px' : '28px' }}>
          <div style={{
            width: isMobile ? '72px' : '84px',
            height: isMobile ? '72px' : '84px',
            borderRadius: '50%',
            overflow: 'hidden',
            marginBottom: '16px',
            boxShadow: '0 0 0 3px rgba(139,92,246,0.35), 0 8px 24px -6px rgba(139,92,246,0.4)',
          }}>
            <Image src="/devcon-logo.jpg" alt="DEVCON logo" width={84} height={84} unoptimized priority style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '6px' }}>
            Protected Access
          </p>
          <h1 style={{ fontSize: isMobile ? '22px' : '26px', lineHeight: 1.15, fontWeight: 800, color: '#e2e8f0', marginBottom: '6px', margin: 0 }}>
            Sign In to Dashboard
          </h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
            DEVCON × Sui — CodeCamp HQ
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #1e293b, transparent)', marginBottom: isMobile ? '20px' : '24px' }} />

        {/* Form */}
        <form onSubmit={submit}>
          <label htmlFor="password" style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#64748b',
            marginBottom: '8px',
          }}>
            Password
          </label>

          {/* Input wrapper with icon */}
          <div style={{ position: 'relative', marginBottom: error ? '8px' : '16px' }}>
            {/* Left icon */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              overflow: 'hidden',
              pointerEvents: 'none',
              flexShrink: 0,
            }}>
              <Image src="/devcon-logo.jpg" alt="" width={26} height={26} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Password input */}
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              autoComplete="current-password"
              required
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '13px 44px 13px 48px',
                borderRadius: '14px',
                border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : '#1e293b'}`,
                background: '#020617',
                color: '#e2e8f0',
                fontSize: isMobile ? '15px' : '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .2s',
                boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
              }}
            />

            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#475569',
                fontSize: '13px',
                lineHeight: 1,
              }}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#f43f5e', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: isMobile ? '13px 16px' : '12px 16px',
              borderRadius: '14px',
              border: 'none',
              background: loading || !password
                ? '#1e293b'
                : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: loading || !password ? '#475569' : '#fff',
              fontSize: isMobile ? '15px' : '14px',
              fontWeight: 700,
              cursor: loading ? 'wait' : !password ? 'default' : 'pointer',
              transition: 'background .2s, transform .1s',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Signing in…' : 'Enter Dashboard →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '20px' }}>
          DEVCON Philippines × Sui Foundation
        </p>
      </section>
    </main>
  )
}
