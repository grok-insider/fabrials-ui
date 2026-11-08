import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodePanel, CodeTabs, File, Files, Folder, LanguageIcon, PackageInstall, PageHeader, RepoInfo, SectionHeader } from "@fabrials/ui";

const meta = {
  title: "Tests/Docs pieces",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const page = `import { Button } from "@/components/ui/button";

export default function Page() {
  const label = "Install Spanreed";
  return <Button size="lg">{label}</Button>;
}`;

function Pieces() {
  return (
    <main className="catalogue">
      <PageHeader title="Docs pieces" description="Code, commands, file trees and repositories, for documentation and developer tools." />
      <section className="catalogue-stack" aria-labelledby="docs-code">
        <SectionHeader title={<span id="docs-code">Code panel</span>} />
        <CodePanel title="app/page.tsx" language="tsx" code={page} highlightLines={[4]} highlightWords={["label"]} lineNumbers />
        <CodePanel
          title="components.json"
          language="json"
          code={'{\n  "style": "new-york",\n  "style": "base-nova",\n  "iconLibrary": "lucide"\n}'}
          removedLines={[2]}
          addedLines={[3]}
        />
        <CodeTabs
          items={[
            { value: "next", label: "Next.js", language: "tsx", code: '"use client";\nimport { MCPDashboard } from "@/components/webmcp/mcp-dashboard";' },
            { value: "vite", label: "Vite", language: "tsx", code: 'import { MCPDashboard } from "@/components/webmcp/mcp-dashboard";' },
          ]}
        />
        <PackageInstall command="shadcn@latest add @fabrials/button" persistKey={null} />
      </section>
      <section className="catalogue-stack" aria-labelledby="docs-marks">
        <SectionHeader title={<span id="docs-marks">Language marks</span>} />
        <ul className="catalogue-row" style={{ flexWrap: "wrap", gap: "var(--fui-space-2) var(--fui-space-5)", margin: 0, padding: 0, listStyle: "none" }}>
          {["ts", "js", "py", "rs", "go", "bash", "html", "css", "yaml", "toml", "md", "diff", "c", "cpp", "java", "kt", "swift", "cs", "dart", "ex", "hs", "scala", "jl", "graphql", "dockerfile", "tf", "nix", "sql", "json", "rb", "text"].map((language) => (
            <li key={language} style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-1-5)", fontSize: "var(--fui-text-sm)" }}>
              <LanguageIcon language={language} style={{ width: "1rem", height: "1rem" }} />
              {language}
            </li>
          ))}
        </ul>
        <CodeTabs
          label="One sample in three languages"
          items={[
            { value: "py", label: "Python", language: "py", code: "headers = fetch_headers(mailbox_id)" },
            {
              value: "rs",
              label: "Rust",
              language: "rs",
              code: "let headers = fetch_headers(&mailbox_id).unwrap();\nlet headers = fetch_headers(&mailbox_id)?;",
              removedLines: [1],
              addedLines: [2],
            },
            { value: "go", label: "Go", language: "go", code: "headers, err := FetchHeaders(mailboxID)" },
          ]}
        />
      </section>
      <section className="catalogue-stack" aria-labelledby="docs-files">
        <SectionHeader title={<span id="docs-files">Files and repositories</span>} />
        <div className="catalogue-row" style={{ alignItems: "flex-start" }}>
          <Files style={{ minWidth: "18rem" }}>
            <Folder name="components" defaultOpen>
              <Folder name="ui" defaultOpen>
                <File name="button.tsx" note="shim" highlighted />
              </Folder>
              <Folder name="webmcp">
                <File name="mcp-dashboard.tsx" />
              </Folder>
            </Folder>
            <File name="components.json" />
          </Files>
          <RepoInfo owner="grok-insider" repo="fabrials-ui" stars={1284} forks={37} />
          <RepoInfo owner="example" repo="instrument-kit" description="Gauges and readouts for dashboards." stars={19400} />
        </div>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <Pieces /> };
