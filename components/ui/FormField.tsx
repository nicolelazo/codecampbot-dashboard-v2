const C = {
  border: '#1e293b', borderFocus: 'rgba(6,182,212,0.5)',
  bg: '#020617', text: '#cfd5dd', muted: '#64748b',
  surface: '#0f172a',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '10px',
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.text, fontSize: '13px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}

export default function FormField({
  label, children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = C.borderFocus; props.onFocus?.(e) }}
      onBlur={e  => { e.currentTarget.style.borderColor = C.border;      props.onBlur?.(e)  }}
    />
  )
}

export function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = C.borderFocus; props.onFocus?.(e) }}
      onBlur={e  => { e.currentTarget.style.borderColor = C.border;      props.onBlur?.(e)  }}
    />
  )
}

export function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: 'pointer', ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = C.borderFocus; props.onFocus?.(e) }}
      onBlur={e  => { e.currentTarget.style.borderColor = C.border;      props.onBlur?.(e)  }}
    />
  )
}
