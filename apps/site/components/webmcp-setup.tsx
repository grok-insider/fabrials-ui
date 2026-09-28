import { CodeBlock } from "@/components/code-block";

export function WebMCPSetup() {
  return (
    <div className="webmcp-setup not-prose">
      <p className="webmcp-setup-lead">WebMCP is experimental. Chrome needs a flag before a page can register tools.</p>
      <ol className="docs-steps">
        <li className="docs-step">
          <p>Copy this address and open it in Chrome.</p>
          <CodeBlock code="chrome://flags/#enable-webmcp-testing" label="Chrome flag" variant="command" language="text" />
        </li>
        <li className="docs-step">
          <p>
            Set <strong>WebMCP for testing</strong> to <strong>Enabled</strong>, relaunch Chrome and open your app again.
          </p>
        </li>
      </ol>
      <p className="webmcp-setup-note">
        The flag enables native tool registration. The playground&apos;s own tool runner, the ordinary controls and remote MCP
        connections work without it. See{" "}
        <a href="https://developer.chrome.com/docs/ai/webmcp" target="_blank" rel="noreferrer">
          Chrome&apos;s WebMCP setup
        </a>
        .
      </p>
    </div>
  );
}
