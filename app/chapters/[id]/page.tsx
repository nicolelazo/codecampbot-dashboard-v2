import Dashboard from '@/components/Dashboard'

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Dashboard initialChapterId={id} />
}
