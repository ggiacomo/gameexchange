import { neonAuth, createAuthServer } from '@neondatabase/auth/next/server'

export const authServer = createAuthServer()

export async function getCurrentUser() {
  const { user } = await neonAuth()
  return user ?? null
}
