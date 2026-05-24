export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#06b6d4] mb-6">
      {children}
      <span className="flex-1 h-px bg-[#1e293b]" />
    </div>
  )
}
