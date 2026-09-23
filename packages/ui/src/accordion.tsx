"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export function Accordion({
  className,
  ...props
}: StyledProps<BaseAccordion.Root.Props>) {
  return (
    <BaseAccordion.Root
      data-slot="accordion"
      className={classes("fui-accordion", className)}
      {...props}
    />
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

export function AccordionTrigger({
  className,
  children,
  ...props
}: StyledProps<BaseAccordion.Trigger.Props>) {
  return (
    <BaseAccordion.Header className="fui-accordion-header">
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={classes("fui-accordion-trigger", className)}
        {...props}
      >
        {children}
        <ChevronDown aria-hidden className="fui-accordion-chevron" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
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
