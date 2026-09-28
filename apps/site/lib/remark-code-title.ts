type MdNode = { type: string; meta?: string | null; data?: { hProperties?: Record<string, unknown> }; children?: MdNode[] };

/** Keeps a fence's `title="app/layout.tsx"` as data-title on the code element, for the code panel's bar. */
export function remarkCodeTitle() {
  return (tree: MdNode) => {
    const visit = (node: MdNode) => {
      if (node.type === "code" && node.meta) {
        const title = /title=(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(node.meta);
        if (title) {
          node.data ??= {};
          node.data.hProperties = { ...node.data.hProperties, "data-title": title[1] ?? title[2] ?? title[3] };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
