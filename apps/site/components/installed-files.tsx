import { File, Files, Folder } from "@fabrials/ui";

type Node = { name: string; note?: string; children: Map<string, Node>; file: boolean };

/** The files an install writes into an app, as a tree; every folder open. */
export function InstalledFiles({ files, label = "Files added to your app" }: { files: { path: string; note?: string }[]; label?: string }) {
  const root: Node = { name: "", children: new Map(), file: false };
  for (const { path, note } of files) {
    let node = root;
    const parts = path.split("/");
    parts.forEach((part, index) => {
      const file = index === parts.length - 1;
      if (!node.children.has(part)) node.children.set(part, { name: part, children: new Map(), file });
      node = node.children.get(part)!;
      if (file) node.note = note;
    });
  }
  const render = (node: Node) =>
    [...node.children.values()]
      .sort((a, b) => Number(a.file) - Number(b.file) || a.name.localeCompare(b.name))
      .map((child) =>
        child.file ? (
          <File key={child.name} name={child.name} note={child.note} />
        ) : (
          <Folder key={child.name} name={child.name} defaultOpen>
            {render(child)}
          </Folder>
        ),
      );
  return <Files aria-label={label}>{render(root)}</Files>;
}
