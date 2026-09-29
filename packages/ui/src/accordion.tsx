"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import {
  createContext,
  createElement,
  useContext,
  useId,
  type FocusEvent,
  type ReactNode,
  type Ref,
} from "react";
import { classes, type StyledProps } from "./shared";

type AccordionVariant = "default" | "rows";
const VariantContext = createContext<AccordionVariant>("default");

/**
 * `variant="rows"` is a stack of independent tools: each row is a 44 px header (an icon, the title, tags and a chevron) over
 * a body that stays mounted while it is closed, so a form inside keeps what was typed and any controller it owns. The open row
 * is marked like the current item of a list (accent fill and a 2 px Stormlight bar). Give the rows `multiple` to let several
 * stay open, and set `--fui-accordion-pad` to change the inline padding of the rows and their bodies.
 */
export function Accordion({
  className,
  variant = "default",
  keepMounted,
  ...props
}: StyledProps<BaseAccordion.Root.Props> & { variant?: AccordionVariant }) {
  return (
    <VariantContext.Provider value={variant}>
      <BaseAccordion.Root
        data-slot="accordion"
        data-variant={variant === "rows" ? "rows" : undefined}
        keepMounted={keepMounted ?? (variant === "rows" ? true : undefined)}
        className={classes("fui-accordion", className)}
        {...props}
      />
    </VariantContext.Provider>
  );
}

export function AccordionItem({
  className,
  ...props
}: StyledProps<BaseAccordion.Item.Props>) {
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={classes("fui-accordion-item", className)}
      {...props}
    />
  );
}

export type AccordionTriggerProps = StyledProps<BaseAccordion.Trigger.Props> & {
  /** The level of the heading that wraps the trigger (2 to 4). Default 3, Base UI's. */
  headingLevel?: 2 | 3 | 4;
  /** A ref to the heading element. The heading then takes `tabIndex={-1}` and hands focus to the trigger, so a command or a
   * deep link can focus "the tool" and land on the control a person can act on. */
  headingRef?: Ref<HTMLHeadingElement>;
  /** Decorative icon before the title (`variant="rows"`). */
  icon?: ReactNode;
  /**
   * Tags, counts or a state beside the title, OUTSIDE the trigger: they are not part of its name and do not make the row a
   * bigger target. The trigger is described by them (`aria-describedby`). Non-interactive: put nothing to click in it.
   */
  aside?: ReactNode;
};

export function AccordionTrigger({
  className,
  children,
  headingLevel,
  headingRef,
  icon,
  aside,
  ...props
}: AccordionTriggerProps) {
  const variant = useContext(VariantContext);
  const asideId = useId();
  const row = variant === "rows" || aside !== undefined;
  const focusable = headingRef !== undefined || variant === "rows";
  const header = (
    <BaseAccordion.Header
      className="fui-accordion-header"
      ref={headingRef}
      render={headingLevel && headingLevel !== 3 ? createElement(`h${headingLevel}`) : undefined}
      tabIndex={focusable ? -1 : undefined}
      onFocus={
        focusable
          ? (event: FocusEvent<HTMLHeadingElement>) => {
              if (event.target === event.currentTarget)
                event.currentTarget
                  .querySelector<HTMLElement>('[data-slot="accordion-trigger"]')
                  ?.focus();
            }
          : undefined
      }
    >
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={classes("fui-accordion-trigger", className)}
        aria-describedby={aside !== undefined ? asideId : undefined}
        {...props}
      >
        {icon ? (
          <span className="fui-accordion-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {row ? <span className="fui-accordion-title">{children}</span> : children}
        {row ? null : <ChevronDown aria-hidden className="fui-accordion-chevron" />}
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
  if (!row) return header;
  return (
    <div className="fui-accordion-head">
      {header}
      {aside !== undefined ? (
        <span id={asideId} className="fui-accordion-aside">
          {aside}
        </span>
      ) : null}
      <ChevronDown aria-hidden className="fui-accordion-chevron" />
    </div>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: StyledProps<BaseAccordion.Panel.Props>) {
  return (
    <BaseAccordion.Panel
      data-slot="accordion-content"
      className={classes("fui-accordion-panel", className)}
      {...props}
    >
      <div className="fui-accordion-content">{children}</div>
    </BaseAccordion.Panel>
  );
}
