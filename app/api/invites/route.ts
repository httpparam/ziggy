import { getInvites } from '@/app/actions/invites'
import { NextResponse } from 'next/server'

export async function GET() {
  const { invites } = await getInvites()
  return NextResponse.json({ invites })
}
