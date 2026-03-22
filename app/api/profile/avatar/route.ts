import { NextRequest, NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const utapi = new UTApi()

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const response = await utapi.uploadFiles(file)
  if (response.error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const url = response.data.ufsUrl
  await db.update(users).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(users.id, user.id))

  return NextResponse.json({ url })
}
