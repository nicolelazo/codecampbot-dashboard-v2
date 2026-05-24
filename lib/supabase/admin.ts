import { createClient } from '@supabase/supabase-js'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function createAdminClient(fetchImpl?: typeof fetch) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  const payload = decodeJwtPayload(serviceRoleKey)
  if (payload?.role && payload.role !== 'service_role') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the service_role key (not anon/authenticated)')
  }

  return createClient(url, serviceRoleKey, fetchImpl ? { global: { fetch: fetchImpl } } : undefined)
}
