import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-[60vh] content-start gap-4 px-(--fui-page-padding) py-20">
      <h1 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none font-semibold">This page doesn&rsquo;t exist.</h1>
      <p className="max-w-[48ch] text-muted-foreground">
        The address doesn&rsquo;t match a Fabrials UI page. It may have moved when the WebMCP registry joined the design
        system.
      </p>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <li>
          <Link className="underline underline-offset-4" href="/docs/introduction">
            Read the documentation
          </Link>
        </li>
        <li>
          <Link className="underline underline-offset-4" href="/components">
            Browse components
          </Link>
        </li>
        <li>
          <Link className="underline underline-offset-4" href="/">
            Go to the home page
          </Link>
        </li>
      </ul>
    </main>
  );
}
