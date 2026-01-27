'use client'

import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await signup(formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.message) {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-[#5bc0de]/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#5bc0de]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl sm:text-7xl font-bold mb-4 text-white">
            Ziggy
          </h1>
          <h2 className="text-2xl font-bold text-white mb-4">
            Check your email!
          </h2>
          <p className="text-zinc-400 mb-8">
            We've sent you a confirmation email. Please click the link in the email to confirm your account and start uploading images.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-lg transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <h1 className="text-6xl sm:text-7xl font-bold text-center mb-2 text-white">
          Ziggy
        </h1>
        <p className="text-center text-zinc-400 mb-12">
          Image hosting made simple
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-zinc-300 mb-2">
              Invite Code <span className="text-zinc-500">(optional for first user)</span>
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              autoComplete="off"
              className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition font-mono"
              placeholder="Your invite code"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-lg transition focus:ring-2 focus:ring-[#5bc0de] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#5bc0de] hover:text-[#4a9dc4] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
