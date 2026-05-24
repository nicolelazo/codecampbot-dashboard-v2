export function liveCountdown(dateIso: string | null | undefined): string {
  if (!dateIso) return 'TBD'
  const diff = Math.ceil((new Date(dateIso).getTime() - Date.now()) / 86_400_000)
  if (diff === 0) return 'Today!'
  if (diff < 0)  return `${Math.abs(diff)}d ago`
  return `T-${diff}d`
}
