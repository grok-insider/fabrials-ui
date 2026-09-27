"use client";
import { jsxs, jsx } from "react/jsx-runtime";
import { useId } from "react";
import { classes } from "./shared.js";
function SettingsSection({
  id,
  title,
  description,
  status,
  headingLevel = 2,
  className,
  children,
  ...props
}) {
  const generated = useId();
  const headingId = `${id ?? generated}-heading`;
  const descriptionId = description ? `${id ?? generated}-description` : void 0;
  const Heading = `h${headingLevel}`;
  return /* @__PURE__ */ jsxs(
    "section",
    {
      id,
      "aria-labelledby": headingId,
      "aria-describedby": descriptionId,
      className: classes("fui-settings-section", className),
      ...props,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "fui-settings-section-intro", children: [
          /* @__PURE__ */ jsxs("div", { className: "fui-settings-section-heading", children: [
            /* @__PURE__ */ jsx(Heading, { id: headingId, className: "fui-settings-section-title", children: title }),
            status
          ] }),
          description ? /* @__PURE__ */ jsx("p", { id: descriptionId, className: "fui-settings-section-description", children: description }) : null
        ] }),
        /* @__PURE__ */ jsx("div", { className: "fui-settings-section-body", children })
      ]
    }
  );
}
export {
  SettingsSection
};
