const C = {
  bg: '#020617',
  surface: '#0f172a',
  border: '#1e293b',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  rose: '#e11d48',
  amber: '#f59e0b',
  muted: '#64748b',
  text: '#cfd5dd',
  dim: '#8899aa',
}

interface ChapterInsight {
  id: number
  name: string
  location: string
  date: string
  stats: { attendees: number; submitted: number; verified: number; verificationRate: number }
  profile: string
  format: string
  whatWorked: string[]
  improvements: string[]
  opportunities: string[]
  color: string
}

const CHAPTERS: ChapterInsight[] = [
  {
    id: 1,
    name: 'Letran Manila Code Camp',
    location: 'Colegio de San Juan de Letrán, Manila',
    date: 'March 28, 2026',
    stats: {
      attendees: 128,
      submitted: 60,
      verified: 29,
      verificationRate: 48,
    },
    profile: 'SHS to 4th Year | Mostly BSIT · Strong GitHub & web dev baseline',
    format: '1:7 mentor-to-student ratio · Sui Slush token distribution',
    whatWorked: [
      '15 mentors at a 1:7 ratio enabled fast, targeted troubleshooting throughout the session',
      'Sui Slush token distribution helped participants cover gas fees for Mainnet deployment',
      'Improved forms and presentation materials led to a smoother overall workflow',
      'High post-session curiosity and peer collaboration; strong motivation to continue exploring blockchain',
    ],
    improvements: [
      'WSL version mismatches (1.44.x) across lab computers caused compatibility issues — standardise WSL version in the pre-event venue checklist',
      'Some participants missed the Mainnet/Testnet switch step — add a prominent network-switch checkpoint in the workshop flow',
      'Sui client updates during the session caused unexpected disruptions — pre-installation must lock the Sui client version',
      'NPM compatibility issues required mid-session reinstallation — add NPM version check to the pre-install checklist',
      'GitHub accounts not prepared in advance caused delays — make GitHub account setup a hard prerequisite in registration confirmation',
      'Sui Slush token budget was insufficient given high gas fees — budget 0.05–0.07 SUI per participant for future camps',
    ],
    opportunities: [
      'Venue lab standardisation checklist (WSL, Node, NPM, Sui version) should become a mandatory pre-event deliverable sent to hosts 2 weeks before camp day',
      'The 0.05–0.07 SUI/participant gas fee guideline should be formalised into the camp budget template',
      'Strong BSIT cohort with web dev background — ideal test bed for an advanced-track curriculum (skip basics, jump to contract logic)',
    ],
    color: C.rose,
  },
  {
    id: 2,
    name: 'Bukidnon Code Camp',
    location: 'Bukidnon State University, Malaybalay City',
    date: 'May 6, 2025',
    stats: {
      attendees: 136,
      submitted: 80,
      verified: 73,
      verificationRate: 91,
    },
    profile: '2nd and 3rd year IT students; Entertainment/Multimedia Computing',
    format: 'BYOD + Pre-Installation Day (first time)',
    whatWorked: [
      'BYOD + Pre-Install Day acted as a natural commitment filter — participants arrived setup-ready and could build immediately',
      'Hands-on mentor support kept energy and engagement levels high throughout',
      'Mandatory pre-installation onboarding significantly reduced setup delays on the day',
    ],
    improvements: [
      'Implement stricter confirmation reminders and an accountability buddy system to mitigate no-shows',
      'Streamline the post-event project verification pipeline for faster turnaround',
      'Update the Bukidnon Dashboard to consistently reflect all data fields in completion forms',
      'Participants struggled to find their OBJECT ID, causing gas token depletion from repeated failed publishes — provide a clearer step-by-step guide and checkpoint for this step',
      'Some participants published contracts but did not update the content — add an explicit post-publish checklist',
    ],
    opportunities: [
      'Strong regional appetite for Web3 development signals high return potential for a follow-up camp',
      'BYOD model scales well to venues without a dedicated computer lab — replicate in similar regional universities',
      'Pre-Install Day format can serve as a template for all future camps to ensure day-of readiness',
    ],
    color: C.teal,
  },
  {
    id: 3,
    name: 'Iloilo Code Camp',
    location: 'Iloilo City',
    date: 'May 16 – May 23, 2025',
    stats: {
      attendees: 164,
      submitted: 162,
      verified: 144,
      verificationRate: 89,
    },
    profile: '159 3rd year · 5 4th year | 74 CS · 90 IT',
    format: 'Two-day split session',
    whatWorked: [
      'Mentors were highly praised — participants highlighted direct, problem-solving assistance that built lasting understanding',
      'CS afternoon session completed in ~2 hours, an hour ahead of schedule — strong cohort preparedness',
      'High submission-to-attendance ratio (162/164) shows excellent day-of engagement',
    ],
    improvements: [
      'Participants had to manually copy commands/links from slides — use a short-link (e.g. TinyURL) pointing to a shared doc with all key commands/links for easy copying',
      '18 submissions flagged as invalid due to private Vercel links — add an explicit "set project to public" step in the workshop checklist',
    ],
    opportunities: [
      'The TinyURL shared-doc approach (improvised during the event) should be standardised across all future camps as a core workflow',
      "Iloilo's CS cohort throughput (2 hrs) suggests the curriculum can be compressed for advanced cohorts — create a fast-track track",
      'Strong local mentor ecosystem — consider recruiting Iloilo-based mentors as regional leads',
    ],
    color: C.cyan,
  },
  {
    id: 4,
    name: 'PUP Biñan Code Camp',
    location: 'Polytechnic University of the Philippines, Biñan Campus, Laguna',
    date: 'May 29, 2025',
    stats: {
      attendees: 86,
      submitted: 60,
      verified: 56,
      verificationRate: 93,
    },
    profile: '22 1st Year · 6 2nd Year · 24 3rd Year · 5 4th Year | 36 IT · 10 CS · 10 CpE',
    format: 'Lab-based + personal laptop hybrid with dedicated mentor split',
    whatWorked: [
      'Dedicated mentor split between lab computers and personal laptops ensured personalised guidance for all setups',
      'Automated Python-based validation script reduced manual verification overhead significantly',
      'High verification rate (95%) among those who submitted shows strong submission quality',
    ],
    improvements: [
      'Large submission gap: only 59 of 103 registrants submitted, with 30+ still pending — implement a post-event follow-up window with a hard deadline',
      'Several participants submitted the SuiScan wallet URL instead of the raw wallet address — add a visual callout in the submission form distinguishing wallet address vs. SuiScan link',
    ],
    opportunities: [
      'The automated Python validation script should be packaged and shared as a reusable tool for all future camps',
      'Wallet address submission confusion is a systemic issue — a short explainer video embedded in the submission form could reduce errors across all camps',
      'Consider a 48-hour post-event submission window to capture the 30+ pending entries',
    ],
    color: '#8b5cf6',
  },
]

const FUTURE_IMPROVEMENTS: { category: string; color: string; items: string[] }[] = [
  {
    category: 'Pre-Event Preparation',
    color: C.cyan,
    items: [
      'Send a locked-version pre-install checklist (Sui CLI, WSL, Node, NPM versions) to participants and host venues at least 2 weeks before camp day — make it a hard registration prerequisite.',
      'Require GitHub account setup as part of the registration confirmation flow, not on the day of the camp.',
      'Mandate a Pre-Installation Day (separate from the main event) for BYOD camps to ensure all participants arrive setup-ready.',
      'Deliver a venue readiness checklist to schools covering lab computer specs, WSL version, and network access — follow up 1 week out to confirm compliance.',
    ],
  },
  {
    category: 'During the Camp',
    color: C.teal,
    items: [
      'Provide a TinyURL short-link at the start of the session pointing to a shared doc with all commands, links, and copy-paste materials — eliminates manual transcription errors.',
      'Add explicit checkpoints in the workshop flow: network switch (Testnet → Mainnet), OBJECT ID retrieval, and post-publish content update.',
      'Split mentor assignments by hardware setup (lab computers vs. personal laptops) so all participants receive targeted, relevant support.',
      'Deploy an automated validation script to reduce manual submission review overhead and provide instant feedback on common errors.',
    ],
  },
  {
    category: 'Submission & Verification',
    color: '#8b5cf6',
    items: [
      'Add inline validators to the submission form to catch common errors: SuiScan URL vs. raw wallet address, private vs. public Vercel links, empty project content.',
      'Open a 48-hour post-event submission window with automated reminders to recover participants who did not submit on the day.',
      'Include an explicit "set Vercel project to public" step in the workshop checklist and submission form instructions.',
      'Add a post-publish checklist requiring participants to verify their deployed content is updated and visible before submitting.',
    ],
  },
  {
    category: 'Gas Fees & Token Budget',
    color: C.amber,
    items: [
      'Budget 0.05–0.07 SUI per participant for gas fees — formalise this into the camp budget template.',
      'Add a pre-publish OBJECT ID checkpoint so participants confirm the correct object before spending gas on a transaction.',
      'Distribute Sui Slush tokens before the deployment session, not during, to avoid delays when participants are ready to publish.',
    ],
  },
  {
    category: 'No-Shows & Drop-offs',
    color: C.rose,
    items: [
      'Implement a three-touch confirmation sequence: 1 week out, 3 days out, and the day before the event.',
      'Introduce an accountability buddy system at registration to improve attendance commitment.',
      'Use the pre-install requirement as a natural commitment filter — participants who complete setup are far more likely to attend and finish.',
    ],
  },
]

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '72px' }}>
      <span style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: C.text, lineHeight: 1.55 }}>
          <span style={{ color, flexShrink: 0, marginTop: '2px' }}>◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: '10px' }}>
      {children}
    </div>
  )
}

export default function InsightsPanel() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header banner */}
      <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: '18px', padding: '18px 22px', fontSize: '14px', color: C.dim, lineHeight: 1.8 }}>
        <strong style={{ color: C.cyan }}>Code Camp Insights</strong> — Learnings, patterns, and opportunities derived from all completed chapters. Use this to inform facilitator prep, budget planning, and future camp strategy.
      </div>

      {/* Per-chapter cards */}
      {CHAPTERS.map(chapter => (
        <div
          key={chapter.id}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}
        >
          {/* Card header */}
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: chapter.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{chapter.name}</span>
                <span style={{ fontSize: '11px', color: chapter.color, background: `${chapter.color}22`, border: `1px solid ${chapter.color}44`, borderRadius: '6px', padding: '2px 8px', fontWeight: 600 }}>
                  Camp {chapter.id}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: C.muted, paddingLeft: '18px' }}>{chapter.location} · {chapter.date}</div>
              <div style={{ fontSize: '12px', color: C.dim, paddingLeft: '18px', marginTop: '4px' }}>Format: {chapter.format}</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <StatBadge label="Attendees" value={chapter.stats.attendees} color={chapter.color} />
              <StatBadge label="Submitted" value={chapter.stats.submitted} color={chapter.color} />
              <StatBadge label="Verified" value={chapter.stats.verified} color={chapter.color} />
            </div>
          </div>

          {/* Attendee profile */}
          <div style={{ padding: '16px 24px 0', fontSize: '12px', color: C.dim }}>
            <span style={{ color: C.muted, fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.07em' }}>Attendee Profile · </span>
            {chapter.profile}
          </div>

          {/* Three columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0', padding: '20px 24px 24px' }}>
            <div style={{ paddingRight: '24px', borderRight: `1px solid ${C.border}` }}>
              <SectionLabel color={C.teal}>What Worked</SectionLabel>
              <BulletList items={chapter.whatWorked} color={C.teal} />
            </div>
            <div style={{ padding: '0 24px', borderRight: `1px solid ${C.border}` }}>
              <SectionLabel color={C.rose}>Areas for Improvement</SectionLabel>
              <BulletList items={chapter.improvements} color={C.rose} />
            </div>
            <div style={{ paddingLeft: '24px' }}>
              <SectionLabel color={C.amber}>Opportunities</SectionLabel>
              <BulletList items={chapter.opportunities} color={C.amber} />
            </div>
          </div>
        </div>
      ))}

      {/* Improvements for future code camps */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Improvements for Future Code Camps
        </div>
        <div style={{ fontSize: '13px', color: C.dim, marginBottom: '20px', lineHeight: 1.6 }}>
          Consolidated action items derived from all four completed camps. Apply these before, during, and after each future chapter.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FUTURE_IMPROVEMENTS.map(group => (
            <div key={group.category} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px 22px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: group.color, marginBottom: '14px' }}>
                {group.category}
              </div>
              <BulletList items={group.items} color={group.color} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
