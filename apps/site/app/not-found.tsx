import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center gap-4 px-6 py-16" id="main-content">
      <h1 className="font-serif text-3xl font-medium tracking-tight">This page doesn&rsquo;t exist.</h1>
      <p className="max-w-lg text-sm leading-6 text-muted-foreground">
        The address doesn&rsquo;t match a Fabrials UI page.
      </p>
      <Link className="text-sm underline-offset-2 hover:underline" href="/">
        Back to the docs
      </Link>
    </main>
  );
}
