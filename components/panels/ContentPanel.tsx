import PanelHeader from '@/components/ui/PanelHeader'

const steps = [
  'Account Preparation Basics',
  'Environment Verification',
  'Configure Sui Client',
  'Fork Git Repository and Clone',
  'Manage Gas & Publishing of Package',
  'Object Deployment & Personal Portfolio Setup',
  'Run Frontend',
  'Push Changes to GitHub Repository',
  'Frontend Deployment (Vercel)',
  'Hackathon Announcements + Optional Advanced Exercises',
]

const CARD: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '32px 1fr', gap: '14px',
  alignItems: 'center', padding: '18px 22px',
  background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px',
  transition: 'border-color .2s',
}

export default function ContentPanel() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '42px' }}>
      <PanelHeader
        eyebrow="Content"
        title="Content Hub"
        subtitle="10-step code camp curriculum · report templates · troubleshooting"
      />

      {/* Alert */}
      <div style={{ display: 'flex', gap: '10px', padding: '18px 22px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', fontSize: '13px', color: '#8899aa', lineHeight: 1.7 }}>
        <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠</span>
        <span>
          <strong style={{ color: '#f59e0b' }}>Content update in progress.</strong> Mike and Lady are revising all materials based on Letran pilot learnings.
          Do <strong style={{ color: '#e11d48' }}>NOT</strong> use pre-Manila materials.
          {' '}<span style={{ color: '#475569' }}>Deliverable: Vercel app + Sui mainnet object (Level 1 folio). Proof: Exercise Completion Form.</span>
        </span>
      </div>

      {/* 10-step program */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>10-Step Code Camp Program</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((step, i) => (
            <div key={i} style={CARD}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#06b6d4', flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cfd5dd' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Troubleshooting — 403 Forbidden on Sui Install</p>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '26px' }}>
          <pre style={{ fontSize: '11px', color: '#14b8a6', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{`wget https://github.com/MystenLabs/sui/releases/download/testnet-v1.44.2/sui-testnet-v1.44.2-ubuntu-x86_64.tgz
tar -xvf sui-testnet-v1.44.2-ubuntu-x86_64.tgz
chmod +x sui
sudo mv sui /usr/local/bin/
sui --version`}</pre>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', padding: '10px 14px', background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: '10px', fontSize: '11px', color: '#8899aa' }}>
            <span style={{ color: '#14b8a6', flexShrink: 0 }}>💡</span>
            <span><strong style={{ color: '#14b8a6' }}>Offline install:</strong> Use USB thumb drives with zipped Sui binaries for restricted WiFi labs.</span>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Report Templates</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '18px' }}>
          {/* Post-event SITREP */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '24px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06b6d4', marginBottom: '12px' }}>Post-Event SITREP</p>
            <pre style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{`EVENT SITREP — [Chapter Name]
Date:         [event date]
Lead:         [name]
Actual pax:   [number] (target: [number])
Session:      [Part 1 only / Part 1 + Dinner]
Key outcomes: [projects, moments]
BIR invoices: [collected / pending]
Liquidation:  [submitted / pending by date]
Issues:       [list or NONE]`}</pre>
          </div>
          {/* Ocular report */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '24px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#14b8a6', marginBottom: '12px' }}>Ocular Report</p>
            <pre style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{`OCULAR REPORT — [Chapter Name]
Date:         [date] · Lead: [name]
Venue:        [venue name]
Labs:         [n] labs, [n] machines each
Network:      [stable / restricted / TBC]
IT admin:     [name]
School org:   [name]
Roadblocks:   [list or NONE]
Install date: [date]`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
