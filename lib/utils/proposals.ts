import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import type { UserPlan } from '@/types/database'

const PROPOSAL_LIMITS: Record<UserPlan, number> = {
  free: 3,
  pro: 10,
}

export async function getActiveProposalCount(
  userId: string,
  libraryItemId: string
): Promise<number> {
  const rows = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(
        eq(proposals.requestedItemId, libraryItemId),
        inArray(proposals.status, ['pending', 'counter_proposed', 'accepted'])
      )
    )

  return rows.length
}

export async function canSendProposal(
  userId: string,
  plan: UserPlan,
  libraryItemId: string
): Promise<boolean> {
  const count = await getActiveProposalCount(userId, libraryItemId)
  return count < PROPOSAL_LIMITS[plan]
}

export function getProposalLimit(plan: UserPlan): number {
  return PROPOSAL_LIMITS[plan]
}
