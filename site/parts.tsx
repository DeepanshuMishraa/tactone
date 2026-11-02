/** The pieces the landing page and the docs share. */

import { highlight } from "../editor/highlight.ts";
import { Morph, useCopy } from "../editor/parts.tsx";
import { Theme } from "./theme.ts";

export const LINKS = {
  github: "https://github.com/DeepanshuMishraa/tactone",
  npm: "https://www.npmjs.com/package/tactone",
} as const;

type Page = "home" | "docs";

/** Sun and moon share one spot; the one leaving turns away and blurs as the other arrives. */
function ThemeToggle() {
  const theme = Theme.use();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="theme-toggle" data-theme-now={theme} aria-label={`Switch to ${next} theme`} onClick={Theme.toggle}>
      <svg className="sun" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" />
      </svg>
      <svg className="moon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M13.5 9.6A5.5 5.5 0 1 1 6.4 2.5a4.3 4.3 0 0 0 7.1 7.1Z" />
      </svg>
    </button>
  );
}

export function Bar({ page }: { readonly page: Page }) {
  return (
    <header className="site-bar">
      <a className="mark" href="/">
        tactone
      </a>
      <nav aria-label="Site">
        <a href="/docs/" aria-current={page === "docs" ? "page" : undefined}>
          Docs
        </a>
        <a href={LINKS.github}>GitHub</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>MIT licensed</span>
      <a href={LINKS.github}>GitHub</a>
      <a href={LINKS.npm}>npm</a>
      <a href="/agents.md">agents.md</a>
    </footer>
  );
}

/** A small arrow that leans forward when its link is hovered. */
export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
    </svg>
  );
}

/** Copy with both icons in the DOM, so the swap to a check can cross-fade both ways. Copying plays success. */
function CopyButton({ text }: { readonly text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" className="button code-copy" data-sound="success" data-copied={copied || undefined} onClick={() => void copy(text)}>
      <span className="copy-icons" aria-hidden="true">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
        </svg>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </span>
      <Morph>{copied ? "Copied" : "Copy"}</Morph>
    </button>
  );
}

/** A command on one line with a copy button, for installs and the editor. */
export function Command({ command }: { readonly command: string }) {
  return (
    <div className="command">
      <code>
        <span aria-hidden="true">$</span> {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}

/** The editor's code panel, always open, with the file it belongs in on top. */
export function Code({ code, file }: { readonly code: string; readonly file?: string }) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <section className="codeblock card site-code" aria-label={file ?? "Code"}>
      <header>
        <span className="code-toggle">{file ?? ""}</span>
        <CopyButton text={code} />
      </header>
      <pre>
        <code>
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines of fixed text have no identity beyond their position.
            <span className="line" key={index}>
              {highlight(line).map((token, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens are rebuilt from the text on every render.
                <span className={`token-${token.kind}`} key={at}>
                  {token.text}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </section>
  );
}
