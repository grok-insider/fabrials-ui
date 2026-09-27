import { CodeBlock } from "@/components/code-block";
export function WebMCPSetup() {
  return (
    <div className="not-prose my-6 space-y-4 rounded-xl border bg-muted/30 p-5 text-sm leading-7">
      <p className="font-medium">
        WebMCP is experimental and must be enabled in Chrome for local testing.
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Copy the address below and paste it into Chrome’s address bar.</li>
        <li>
          Set <strong>WebMCP for testing</strong> to <strong>Enabled</strong>.
        </li>
        <li>Relaunch Chrome, then open your app again.</li>
      </ol>
      <CodeBlock
        code="chrome://flags/#enable-webmcp-testing"
        label="Chrome flag"
        variant="command"
      />
      <p className="text-muted-foreground">
        The flag enables native browser tool registration. The playground’s
        local tool runner, ordinary UI controls and remote MCP connections work
        without it.
      </p>
      <a
        href="https://developer.chrome.com/docs/ai/webmcp"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4"
      >
        Chrome’s experimental WebMCP setup ↗
      </a>
    </div>
  );
}
