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

export function Toaster({
  theme,
  className,
  style,
  expand,
  closeButton,
  gap,
  richColors: _richColors,
  icons: _icons,
  ...props
}: ToasterProps) {
  const detected = useDocumentTheme();
  return (
    <Sonner
      theme={theme ?? detected}
      expand={expand ?? false}
      closeButton={closeButton ?? false}
      gap={gap ?? 8}
      className={["fui-toaster", className].filter(Boolean).join(" ")}
      icons={{
        success: <CircleCheckIcon aria-hidden className="fui-toast-icon" data-tone="success" />,
        info: <InfoIcon aria-hidden className="fui-toast-icon" data-tone="info" />,
        warning: <TriangleAlertIcon aria-hidden className="fui-toast-icon" data-tone="warning" />,
        error: <OctagonXIcon aria-hidden className="fui-toast-icon" data-tone="danger" />,
        loading: <LoaderCircle aria-hidden className="fui-toast-icon fui-spin" />,
      }}
      style={
        {
          ...style,
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--fui-radius-xl)",
          "--success-bg": "color-mix(in oklab, var(--success) 9%, var(--popover))",
          "--success-border": "color-mix(in oklab, var(--fui-success-ink) 30%, var(--border))",
          "--success-text": "var(--foreground)",
          "--error-bg": "color-mix(in oklab, var(--destructive) 8%, var(--popover))",
          "--error-border": "color-mix(in oklab, var(--fui-danger-ink) 40%, var(--border))",
          "--error-text": "var(--foreground)",
          "--warning-bg": "color-mix(in oklab, var(--warning) 11%, var(--popover))",
          "--warning-border": "color-mix(in oklab, var(--fui-warning-ink) 32%, var(--border))",
          "--warning-text": "var(--foreground)",
          "--info-bg": "color-mix(in oklab, var(--brand) 8%, var(--popover))",
          "--info-border": "color-mix(in oklab, var(--brand-ink) 30%, var(--border))",
          "--info-text": "var(--foreground)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { toast } from "sonner";
