import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gh-text-muted">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">Page not found</h1>
      <p className="mt-2 text-sm text-gh-text-muted">The link may be broken or the page was moved.</p>
      <Link
        href="/"
        className="mt-8 inline-flex justify-center text-sm font-medium text-gh-accent underline decoration-gh-accent/40 underline-offset-2 transition-colors hover:text-gh-accent-hover"
      >
        Go home
      </Link>
    </main>
  );
}
