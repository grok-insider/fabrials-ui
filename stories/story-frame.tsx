import type { ReactNode } from "react";
import { DirectionProvider, PageHeader, SectionHeader } from "@fabrials/ui";

/** A catalogue page: the page title, then blocks. */
export function Page({ title, description, wide = false, children }: { title: string; description: string; wide?: boolean; children: ReactNode }) {
  return (
    <main className="catalogue" style={wide ? { maxWidth: "none" } : undefined}>
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}

/**
 * A width the component is asked to live in: `358` is a phone pane, and the frame never grows past the window. A
 * right-to-left frame also tells Base UI the direction, as a right-to-left app does at its root.
 */
export function Frame({ width, dir, children }: { width?: number; dir?: "rtl"; children: ReactNode }) {
  return (
    <div
      dir={dir}
      style={{
        width: "100%",
        boxSizing: "border-box",
        maxWidth: width ? `${width}px` : undefined,
        minWidth: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--fui-radius-lg)",
        background: "var(--card)",
        padding: "var(--fui-space-3)",
      }}
    >
      {dir ? <DirectionProvider direction={dir}>{children}</DirectionProvider> : children}
    </div>
  );
}

export function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} description={description} />
      <div className="catalogue-stack" style={{ marginTop: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" }}>
        {children}
      </div>
    </section>
  );
}
