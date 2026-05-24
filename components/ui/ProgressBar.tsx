export default function ProgressBar({ percent, color = 'default' }: { percent: number; color?: 'default' | 'yellow' | 'teal' | 'purple' }) {
  const fillStyle =
    color === 'yellow' ? 'background: linear-gradient(90deg, #FFB547, #ffcc00)' :
    color === 'teal' ? 'background: linear-gradient(90deg, #00D4AA, #00ffcc)' :
    color === 'purple' ? 'background: #A78BFA' :
    'background: linear-gradient(90deg, #4DA2FF, #00D4AA)'

  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${percent}%`, ...(color !== 'default' ? { background: color === 'yellow' ? 'linear-gradient(90deg,#FFB547,#ffcc00)' : color === 'teal' ? 'linear-gradient(90deg,#00D4AA,#00ffcc)' : '#A78BFA' } : {}) }} />
    </div>
  )
}
