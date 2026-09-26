import { type ComponentProps, type ReactNode } from "react";
export type CitationSource = {
    url: string;
    title?: string;
    number?: number;
};
export type FaviconResolver = (url: string) => string | null | undefined;
export declare function hostnameFromUrl(value: string): string;
export declare function sourcePath(value: string): string;
export declare function sourceLabel(source: {
    url: string;
    title?: string;
}): string;
export declare function CitationProvider({ sources, faviconUrl, children, }: {
    sources?: readonly CitationSource[] | ReadonlyMap<number, CitationSource>;
    faviconUrl?: FaviconResolver;
    children: ReactNode;
}): import("react").JSX.Element;
export type CitationHandlers = {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
};
export declare function useCitation(n: number | null | undefined): {
    active: boolean;
    handlers: CitationHandlers;
    source: CitationSource | undefined;
    faviconUrl: FaviconResolver | undefined;
};
export declare function SourceFavicon({ url, faviconUrl, className, }: {
    url: string;
    faviconUrl?: FaviconResolver;
    className?: string;
}): import("react").JSX.Element;
export type CitationChipProps = Omit<ComponentProps<"a">, "href" | "children"> & {
    number: number;
    href: string;
    source?: {
        url: string;
        title?: string;
    };
    active?: boolean;
    faviconUrl?: FaviconResolver;
    delay?: number;
};
export declare function CitationChip({ number, href, source, active, faviconUrl, delay, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }: CitationChipProps): import("react").JSX.Element;
export type SourceCardProps = Omit<ComponentProps<"a">, "title" | "href"> & {
    url: string;
    title?: string;
    number?: number;
    active?: boolean;
    faviconUrl?: FaviconResolver;
};
export declare function SourceCard({ url, title, number, active, faviconUrl, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }: SourceCardProps): import("react").JSX.Element;
export type SourcesProps = {
    sources: readonly CitationSource[];
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    faviconUrl?: FaviconResolver;
    label?: (count: number) => ReactNode;
    previewCount?: number;
    className?: string;
};
export declare function sourcesLabel(count: number): string;
export declare function Sources({ sources, defaultOpen, open: openProp, onOpenChange, faviconUrl, label, previewCount, className, }: SourcesProps): import("react").JSX.Element | null;
