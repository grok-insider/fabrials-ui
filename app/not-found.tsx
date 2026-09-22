import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center gap-4 px-6 py-16" id="main-content">
      <p className="text-sm tracking-wide text-muted-foreground uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page doesn't exist.</h1>
      <p className="max-w-lg text-sm leading-6 text-muted-foreground">
        The address doesn't match a Fabrials UI page.
      </p>
      <Link className="text-sm underline-offset-2 hover:underline" href="/">
        Back to the docs
      </Link>
    </main>
  );
}
