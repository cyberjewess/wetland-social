export default function GlobalFeedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Authentication Successful!
        </h1>
        <p className="text-foreground/60 mb-6">
          You are now signed in with your Bluesky account.
        </p>
        <p className="text-sm text-foreground/40">
          The feed functionality will be implemented in Phase 6.
        </p>
      </div>
    </div>
  )
}
