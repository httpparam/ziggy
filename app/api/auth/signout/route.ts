import { logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export async function POST() {
  await logout()
}
