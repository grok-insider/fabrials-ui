"use client";
// Origin: shadcn/ui sonner wrapper, copied 2026-09-22. Restyled with fui- tokens in 0.4.

import { useEffect, useState, type CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  LoaderCircle,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

function useDocumentTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setTheme(
        root.classList.contains("dark") || root.dataset.theme === "dark"
          ? "dark"
          : "light",
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export function Toaster({ theme, className, style, ...props }: ToasterProps) {
  const detected = useDocumentTheme();
  return (
    <Sonner
      theme={theme ?? detected}
      className={["fui-toaster", "toaster", "group", className].filter(Boolean).join(" ")}
      icons={{
        success: <CircleCheckIcon aria-hidden className="fui-toast-icon" data-tone="success" />,
        info: <InfoIcon aria-hidden className="fui-toast-icon" data-tone="info" />,
        warning: <TriangleAlertIcon aria-hidden className="fui-toast-icon" data-tone="warning" />,
        error: <OctagonXIcon aria-hidden className="fui-toast-icon" data-tone="danger" />,
        loading: <LoaderCircle aria-hidden className="fui-toast-icon fui-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--fui-radius-lg)",
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { toast } from "sonner";
