"use client";

import { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./menu";
import { classes } from "./shared";

export type TruncatedTextProps = {
  children: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
};

export function TruncatedText({
  children,
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
}: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      open={open}
      disableHoverablePopup
      onOpenChange={(next) => {
        const element = ref.current;
        if (next && (!element || element.scrollWidth <= element.clientWidth)) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        render={<span ref={ref} className={classes("fui-truncated-text", className)} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        className="fui-truncated-text-tooltip"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
