import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodePanel, CodeTabs, File, Files, Folder, PackageInstall, PageHeader, RepoInfo, SectionHeader } from "@fabrials/ui";

const meta = {
  title: "Fabrials/Docs pieces",
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
          <RepoInfo owner="magicuidesign" repo="magicui" description="Animated components for landing pages." stars={19400} />
        </div>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <Pieces /> };
