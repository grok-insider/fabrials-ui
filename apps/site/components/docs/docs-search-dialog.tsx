"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, Hash } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@fabrials/ui";
import { docsNav } from "@/lib/docs-nav";
import "./docs.css";

interface SearchResult {
  id: string;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
}

function Highlighted({ text }: { text: string }) {
  return text
    .split(/(<mark>.*?<\/mark>)/g)
    .map((part, index) =>
      part.startsWith("<mark>") ? (
        <mark key={index}>{part.slice(6, -7)}</mark>
      ) : (
        part.replace(/<[^>]+>/g, "")
      ),
    );
}

export function DocsSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [failed, setFailed] = useState(false);
  const needle = query.trim();

  useEffect(() => {
    if (!needle) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?query=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(response)))
        .then((data: SearchResult[]) => {
          setResults(data.slice(0, 24));
          setFailed(false);
        })
        .catch((error: unknown) => {
          if ((error as Error)?.name !== "AbortError") setFailed(true);
        });
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [needle]);

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="docs-search" showCloseButton={false}>
        <DialogTitle className="fui-sr-only">Search documentation</DialogTitle>
        <DialogDescription className="fui-sr-only">
          Type to search every page, then press Enter to open a result.
        </DialogDescription>
        <Command label="Search documentation" shouldFilter={false}>
          <CommandInput
            aria-label="Search documentation"
            placeholder="Search documentation"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {needle ? (
              <>
                <CommandEmpty>
                  {failed ? "Search is unavailable. Try again." : "No matching page."}
                </CommandEmpty>
                {results.length > 0 && (
                  <CommandGroup heading="Results">
                    {results.map((result) => (
                      <CommandItem key={result.id} value={result.id} onSelect={() => go(result.url)}>
                        {result.type === "page" ? (
                          <FileText aria-hidden="true" />
                        ) : (
                          <Hash aria-hidden="true" />
                        )}
                        <span className="docs-search-text" data-type={result.type}>
                          <Highlighted text={result.content} />
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              docsNav.map((group) => (
                <CommandGroup key={group.name} heading={group.name}>
                  {group.pages.map((page) => (
                    <CommandItem key={page.href} value={page.href} onSelect={() => go(page.href)}>
                      <FileText aria-hidden="true" />
                      <span className="docs-search-text">{page.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
