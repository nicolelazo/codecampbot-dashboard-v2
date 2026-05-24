import type { BadgeVariant } from '@/lib/types'

const TOKENS: Record<BadgeVariant, { background: string; color: string; borderColor: string }> = {
  done: {
    background: 'rgba(20,184,166,0.14)',
    color: '#14b8a6',
    borderColor: 'rgba(20,184,166,0.38)',
  },
  warn: {
    background: 'rgba(245,158,11,0.14)',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.38)',
  },
  risk: {
    background: 'rgba(225,29,72,0.14)',
    color: '#ff2f61',
    borderColor: 'rgba(225,29,72,0.42)',
  },
  pending: {
    background: 'rgba(6,182,212,0.14)',
    color: '#06b6d4',
    borderColor: 'rgba(6,182,212,0.38)',
  },
  tbc: {
    background: 'rgba(120,100,255,0.14)',
    color: '#a78bfa',
    borderColor: 'rgba(120,100,255,0.38)',
  },
  cancelled: {
    background: 'rgba(100,116,139,0.14)',
    color: '#94a3b8',
    borderColor: 'rgba(100,116,139,0.4)',
  },
}

const SIZE_TOKENS = {
  sm: {
    gap: '6px',
    minHeight: '28px',
    padding: '6px 12px',
    borderRadius: '10px',
    fontSize: '10px',
    letterSpacing: '0.035em',
  },
  md: {
    gap: '8px',
    minHeight: '32px',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '11px',
    letterSpacing: '0.04em',
  },
} as const

type BadgeSize = keyof typeof SIZE_TOKENS

function splitIconAndText(children: React.ReactNode): { icon: string | null; text: string | null; raw: React.ReactNode } {
  if (typeof children !== 'string') {
    return { icon: null, text: null, raw: children }
  }

  const normalized = children.trim().replace(/\s+/g, ' ')
  const match = normalized.match(/^([^\p{L}\p{N}\s]+)\s*(.*)$/u)

  if (!match) {
    return { icon: null, text: normalized, raw: normalized }
  }

  const [, icon, text] = match
  if (!text) {
    return { icon: null, text: normalized, raw: normalized }
  }

  return { icon, text, raw: normalized }
}

export default function Badge({ variant, size = 'md', children }: { variant: BadgeVariant; size?: BadgeSize; children: React.ReactNode }) {
  const token = TOKENS[variant]
  const sizing = SIZE_TOKENS[size]
  const { icon, text, raw } = splitIconAndText(children)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizing.gap,
        minHeight: sizing.minHeight,
        padding: sizing.padding,
        borderRadius: sizing.borderRadius,
        border: `1px solid ${token.borderColor}`,
        background: token.background,
        color: token.color,
        fontSize: sizing.fontSize,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: sizing.letterSpacing,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
      {text ? <span style={{ lineHeight: 1 }}>{text}</span> : raw}
    </span>
  )
}
