interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export default function PanelHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#64748b', marginBottom: '8px' }}>
          {eyebrow}
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#cfd5dd', lineHeight: 1.1, margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', lineHeight: 1.7 }}>{subtitle}</p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0, paddingTop: '6px' }}>{right}</div>}
    </div>
  )
}
