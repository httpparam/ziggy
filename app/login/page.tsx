import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <h1 className="text-6xl sm:text-7xl font-bold text-center mb-2 text-white">
          Ziggy
        </h1>
        <p className="text-center text-zinc-400 mb-12">
          Image hosting made simple
        </p>

        <form action={login} className="space-y-6">
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
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-lg transition focus:ring-2 focus:ring-[#5bc0de]"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#5bc0de] hover:text-[#4a9dc4] font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
