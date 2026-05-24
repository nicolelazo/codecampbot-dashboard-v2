export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0f172a] border border-[#1e293b] rounded-3xl p-7 transition-colors hover:border-[rgba(6,182,212,0.3)] ${className}`}>
      {children}
    </div>
  )
}
