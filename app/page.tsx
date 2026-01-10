import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <main className="flex flex-col items-center gap-8 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Wetland Social
          </h1>
          <p className="text-xl text-emerald-700 dark:text-emerald-400 font-medium">
            Stratified social media for the AT Protocol
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 max-w-2xl">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Share posts at different visibility levels: from intimate circles to
            global reach. Built on the decentralized AT Protocol, giving you
            control over your social experience.
          </p>

          <div className="flex flex-col gap-3 text-base text-zinc-500 dark:text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">●</span>
              <span>Circle posts for trusted groups</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">●</span>
              <span>Global posts for public reach</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">●</span>
              <span>Powered by your Bluesky identity</span>
            </div>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="mt-4 flex h-14 items-center justify-center rounded-lg bg-emerald-600 px-8 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          Sign in with Bluesky
        </Link>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          Uses your existing Bluesky account via secure OAuth
        </p>
      </main>
    </div>
  )
}
