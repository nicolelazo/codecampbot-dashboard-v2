import { Suspense } from 'react'
import Dashboard from '@/components/Dashboard'

function DashboardFallback() {
  return <div>Loading dashboard...</div>
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  )
}
