// Origin: Lucide icons (ISC, lucide.dev) path data, copied 2026-09-26 so @fabrials/ai-ui stays free of an icon dependency.
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function icon(paths: ReactNode) {
  return function Icon({ className, ...props }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6" />);
export const XIcon = icon(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);
export const CopyIcon = icon(
  <>
    <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
);
export const CheckIcon = icon(<path d="M20 6 9 17l-5-5" />);
export const DownloadIcon = icon(
  <>
    <path d="M12 15V3" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
  </>,
);
export const MicIcon = icon(
  <>
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect height="13" rx="3" width="6" x="9" y="2" />
  </>,
);
export const ArrowUpIcon = icon(
  <>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </>,
);
export const SquareIcon = icon(
  <rect fill="currentColor" height="18" rx="2" width="18" x="3" y="3" />,
);
export const FileTextIcon = icon(
  <>
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </>,
);
export const ImageIcon = icon(
  <>
    <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>,
);
export const GlobeIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>,
);
export const SearchIcon = icon(
  <>
    <path d="m21 21-4.34-4.34" />
    <circle cx="11" cy="11" r="8" />
  </>,
);
export const BrainIcon = icon(
  <>
    <path d="M12 18V5" />
    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <path d="M18 18a4 4 0 0 0 2-7.464" />
    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <path d="M6 18a4 4 0 0 1-2-7.464" />
    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </>,
);
export const PaperclipIcon = icon(
  <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />,
);
export const VideoIcon = icon(
  <>
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    <rect height="12" rx="2" width="14" x="2" y="6" />
  </>,
);
export const MusicIcon = icon(
  <>
    <circle cx="8" cy="18" r="4" />
    <path d="M12 18V2l7 4" />
  </>,
);
export const PencilIcon = icon(
  <>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </>,
);
export const RefreshIcon = icon(
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </>,
);
export const TerminalIcon = icon(
  <>
    <path d="m7 11 2-2-2-2" />
    <path d="M11 13h4" />
    <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
  </>,
);
export const AlertIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>,
);
export const ExternalLinkIcon = icon(
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>,
);
