import { getUserStats } from '@/app/actions/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await getUserStats()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }

  return NextResponse.json(result)
}
