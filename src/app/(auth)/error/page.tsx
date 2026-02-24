import Link from "next/link";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      {reason === "setup" && (
        <p className="max-w-md text-center text-muted-foreground">
          The app couldn’t load your account. This often happens when the database hasn’t been set up yet.
          Run the migration on your production database, then try again.
        </p>
      )}
      <div className="flex gap-4">
        <Link href="/sign-in" className="text-primary underline">
          Sign in again
        </Link>
        <Link href="/create-organization" className="text-primary underline">
          Create organization
        </Link>
      </div>
    </div>
  );
}
