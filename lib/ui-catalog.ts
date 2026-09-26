export type UiGroup =
  | "Controls"
  | "Overlays"
  | "Collections"
  | "Navigation"
  | "Composition"
  | "Metrics"
  | "Patterns"
  | "Effects"
  | "AI chat";

export type UiPackage = "@fabrials/ui" | "@fabrials/ai-ui";

export interface UiCatalogItem {
  slug: string;
  title: string;
  group: UiGroup;
  description: string;
  exports: string[];
  props: [string, string, string][];
  note: string;
  usage: string;
  package: UiPackage;
}

export const uiGroups: { name: UiGroup; description: string }[] = [
  {
    name: "Controls",
    description: "Buttons, fields and choices used across Fabrials products.",
  },
  {
    name: "Overlays",
    description: "Dialogs, menus and previews that keep keyboard focus.",
  },
  {
    name: "Collections",
    description: "Tables, tabs and other ways to scan a set of records.",
  },
  {
    name: "Navigation",
    description: "Shells, menus and the command palette.",
  },
  {
    name: "Composition",
    description: "Groups, loading and motion used inside a task.",
  },
  {
    name: "Metrics",
    description: "Totals and series drawn from real usage data.",
  },
  {
    name: "Patterns",
    description: "Page structure shared by operational screens.",
  },
  {
    name: "Effects",
    description: "Decorative moonlight for sign-in and landing pages only.",
  },
  {
    name: "AI chat",
    description: "Presentational chat pieces from @fabrials/ai-ui. The host supplies the data.",
  },
];

function ui(
  slug: string,
  title: string,
  group: UiGroup,
  description: string,
  exports: string[],
  props: UiCatalogItem["props"],
  note: string,
  pkg: UiPackage = "@fabrials/ui",
): UiCatalogItem {
  return {
    slug,
    title,
    group,
    description,
    exports,
    props,
    note,
    usage:
      pkg === "@fabrials/ai-ui"
        ? `import { ${exports.join(", ")} } from "${pkg}";\nimport "@fabrials/ai-ui/styles.css";`
        : `import { ${exports.join(", ")} } from "${pkg}";`,
    package: pkg,
  };
}

function aiUi(
  slug: string,
  title: string,
  description: string,
  exports: string[],
  props: UiCatalogItem["props"],
  note: string,
): UiCatalogItem {
  return ui(slug, title, "AI chat", description, exports, props, note, "@fabrials/ai-ui");
}

export const uiCatalog: UiCatalogItem[] = [
  ui(
    "button",
    "Button",
    "Controls",
    "The action control. One primary action per task, with quiet alternatives.",
    ["Button"],
    [
      ["variant", "default | outline | secondary | ghost | destructive | link", "Visual weight of the action."],
      ["disabled", "boolean", "Unavailable actions stay visible and unnamed as the next step."],
      ["type", "button | submit | reset", "Use submit inside a form."],
    ],
    "Standard controls are 40px. Compact density is a composition option on the parent, not a second button size.",
  ),
  ui(
    "input",
    "Input",
    "Controls",
    "A single-line text field for names, identifiers and short values.",
    ["Input"],
    [
      ["aria-label / label", "string", "Pair it with Label or Field. Placeholder text is not the name."],
      ["disabled", "boolean", "Keeps the value readable."],
    ],
    "Validation belongs to the host. Field connects the label, hint and error.",
  ),
  ui(
    "textarea",
    "Textarea",
    "Controls",
    "A multi-line field for notes, prompts and messages.",
    ["Textarea"],
    [
      ["rows", "number", "Visible height. The field can grow with content in the host."],
    ],
    "Use it for text the person writes. Do not put formatted HTML in the value.",
  ),
  ui(
    "label",
    "Label",
    "Controls",
    "The visible name of a control.",
    ["Label"],
    [
      ["htmlFor", "string", "Id of the control this name belongs to."],
    ],
    "Field renders the label for you when the control has a hint or an error.",
  ),
  ui(
    "field",
    "Field",
    "Controls",
    "Connects a label, hint and error to one control.",
    ["Field"],
    [
      ["label", "ReactNode", "Visible name."],
      ["description", "ReactNode", "Hint announced with the control."],
      ["error", "ReactNode", "Shown after a failed check. Marks the control invalid."],
      ["children", "(props) => ReactNode", "Receives id and aria attributes to spread onto the control."],
    ],
    "The host decides when a value is invalid. Field only wires the accessible relationship.",
  ),
  ui(
    "checkbox",
    "Checkbox",
    "Controls",
    "A binary choice that can sit in a form or a selection list.",
    ["Checkbox"],
    [
      ["checked", "boolean", "Controlled state."],
      ["onCheckedChange", "(checked) => void", "Called when the person toggles it."],
    ],
    "The label is a neighbour, not text inside the checkbox.",
  ),
  ui(
    "switch",
    "Switch",
    "Controls",
    "An immediate on or off setting.",
    ["Switch"],
    [
      ["checked", "boolean", "Current setting."],
      ["onCheckedChange", "(checked) => void", "Called when the setting changes."],
    ],
    "Use a switch for something that takes effect now. Use a checkbox when the change is saved with the rest of a form.",
  ),
  ui(
    "select",
    "Select",
    "Controls",
    "A closed list of options.",
    ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"],
    [
      ["defaultValue", "string", "Initial selected value."],
      ["value", "string", "Selected item value on SelectItem."],
    ],
    "NativeSelect remains for pages that need a native control inside a plain form. This select is the styled list.",
  ),
  ui(
    "dialog",
    "Dialog",
    "Overlays",
    "A modal task with a title, an explanation and explicit actions.",
    ["Dialog", "DialogTrigger", "DialogContent", "DialogTitle", "DialogDescription", "DialogClose"],
    [
      ["open", "boolean", "Controlled open state."],
      ["onOpenChange", "(open) => void", "Fires on open and dismiss."],
    ],
    "Focus moves into the dialog and returns to the trigger on Escape. The title names the task.",
  ),
  ui(
    "alert-dialog",
    "Alert dialog",
    "Overlays",
    "A confirmation for a destructive or hard-to-undo action.",
    ["AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogTitle", "AlertDialogCancel", "AlertDialogAction"],
    [
      ["open", "boolean", "Controlled open state."],
    ],
    "The confirm button names the consequence. Cancel is present and is not the primary action.",
  ),
  ui(
    "sheet",
    "Sheet",
    "Overlays",
    "A side panel for filters and secondary tasks.",
    ["Sheet", "SheetTrigger", "SheetContent", "SheetTitle", "SheetDescription"],
    [
      ["side", "left | right", "Which edge the panel uses."],
    ],
    "Sheet is the dialog primitive anchored to an edge. It still traps focus.",
  ),
  ui(
    "dropdown-menu",
    "Dropdown menu",
    "Overlays",
    "A small list of actions for one record.",
    ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem"],
    [
      ["variant", "default | destructive", "destructive marks a dangerous item."],
    ],
    "Open it from a button that names the record. Do not hide the only primary action in the menu.",
  ),
  ui(
    "tooltip",
    "Tooltip",
    "Overlays",
    "A short name for an icon button.",
    ["TooltipProvider", "Tooltip", "TooltipTrigger", "TooltipContent"],
    [
      ["children", "ReactNode", "The trigger and the tooltip content."],
    ],
    "The tooltip repeats a name that is also available to assistive tech. It is not the only label.",
  ),
  ui(
    "hover-card",
    "Hover card",
    "Overlays",
    "A preview of a person, file or citation.",
    ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
    [
      ["open", "boolean", "Controlled open state."],
    ],
    "The same content must be reachable from the keyboard, not only from hover.",
  ),
  ui(
    "popover",
    "Popover",
    "Overlays",
    "A small anchored panel for one extra choice.",
    ["Popover", "PopoverTrigger", "PopoverContent"],
    [
      ["open", "boolean", "Controlled open state."],
    ],
    "Use a dialog when the task has a title and a submit action. Use a popover for a short anchored choice.",
  ),
  ui(
    "table",
    "Table",
    "Collections",
    "A data table with a caption and column headers.",
    ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
    [
      ["children", "ReactNode", "Caption, header and body."],
    ],
    "The table scrolls inside its region. The page itself does not scroll sideways.",
  ),
  ui(
    "tabs",
    "Tabs",
    "Collections",
    "Switch between peer views of the same subject.",
    ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    [
      ["defaultValue", "string", "The panel shown first."],
      ["value", "string", "Matches a trigger to its panel."],
    ],
    "Each trigger names its panel. Do not use tabs for a step sequence.",
  ),
  ui(
    "badge",
    "Badge",
    "Collections",
    "A short status that always has a text label.",
    ["Badge"],
    [
      ["tone", "neutral | success | warning | danger", "Color is paired with the word."],
    ],
    "Color is not the only signal. The text says what the status is.",
  ),
  ui(
    "card",
    "Card",
    "Collections",
    "A bounded summary of one subject.",
    ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter"],
    [
      ["children", "ReactNode", "Header, content and optional footer."],
    ],
    "A card is a section, not a clickable surface, unless the host adds one action.",
  ),
  ui(
    "alert",
    "Alert",
    "Collections",
    "A status that stays on the page.",
    ["Alert", "AlertTitle", "AlertDescription", "AlertAction"],
    [
      ["variant", "default | destructive", "destructive announces an error."],
    ],
    "Say what happened and what the person can do. A healthy connection stays quiet.",
  ),
  ui(
    "separator",
    "Separator",
    "Collections",
    "A visual break between groups.",
    ["Separator"],
    [
      ["orientation", "horizontal | vertical", "Direction of the rule."],
    ],
    "A separator is decorative. Headings name the groups.",
  ),
  ui(
    "skeleton",
    "Skeleton",
    "Collections",
    "A placeholder while the first response is still loading.",
    ["Skeleton"],
    [
      ["className", "string", "Set the height and width of the placeholder."],
    ],
    "Use a skeleton for the first load. A later refresh keeps the last value and says when it is stale.",
  ),
  ui(
    "progress",
    "Progress",
    "Collections",
    "How far a known task has gone.",
    ["Progress"],
    [
      ["value", "number", "Current amount."],
      ["max", "number", "Completed amount. Defaults to 1 or 100 depending on the host."],
    ],
    "If the duration is unknown, use Spinner instead of a bar stuck at an invented percent.",
  ),
  ui(
    "combobox",
    "Combobox",
    "Collections",
    "A text field that filters a list of known values.",
    ["Combobox"],
    [
      ["items", "string[]", "Values the field can suggest."],
    ],
    "The input keeps its accessible name. Empty results say that nothing matched.",
  ),
  ui(
    "collapsible",
    "Collapsible",
    "Collections",
    "A disclosure for reasoning, sources or a long detail.",
    ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
    [
      ["defaultOpen", "boolean", "Start expanded when the detail is the point of the screen."],
    ],
    "The trigger names what is hidden. The content stays in the tab order when open.",
  ),
  ui(
    "scroll-area",
    "Scroll area",
    "Collections",
    "A region that scrolls without moving the page.",
    ["ScrollArea"],
    [
      ["children", "ReactNode", "The content taller than the region."],
    ],
    "The region has an accessible name when it is the only way to reach the content.",
  ),
  ui(
    "navigation-menu",
    "Navigation menu",
    "Navigation",
    "The top-level links of a site, with one panel of related links.",
    ["NavigationMenu", "NavigationMenuList", "NavigationMenuItem", "NavigationMenuTrigger", "NavigationMenuContent", "NavigationMenuLink"],
    [
      ["href", "string", "Destination of a link."],
    ],
    "Marketing pages can use this menu. They do not become a WorkspaceShell.",
  ),
  ui(
    "sidebar",
    "Sidebar",
    "Navigation",
    "The persistent navigation of an operational app.",
    ["SidebarProvider", "SidebarMenu", "SidebarMenuItem", "SidebarMenuButton"],
    [
      ["isActive", "boolean", "Marks the current destination."],
    ],
    "Below 768px the full sidebar shell becomes a sheet. This preview shows the menu buttons the shell contains. The host owns routing.",
  ),
  ui(
    "command",
    "Command",
    "Navigation",
    "The command palette. Search a short list of real destinations.",
    ["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem", "CommandDialog", "Kbd"],
    [
      ["open", "boolean", "CommandDialog open state."],
    ],
    "fabrials.com and the ai-relay console open this with Ctrl or Command K. Radiant uses Command to choose a model and does not add a second palette.",
  ),
  ui(
    "kbd",
    "Kbd",
    "Navigation",
    "A flat hint for a keyboard shortcut.",
    ["Kbd"],
    [
      ["children", "ReactNode", "The key label, such as Ctrl or K."],
    ],
    "This is a flat label. It is not a 3D keycap.",
  ),
  ui(
    "button-group",
    "Button group",
    "Composition",
    "Related actions that belong to one choice.",
    ["ButtonGroup", "Button"],
    [
      ["orientation", "horizontal | vertical", "Direction of the group."],
    ],
    "Group actions that change the same subject. Do not group unrelated buttons just to save space.",
  ),
  ui(
    "input-group",
    "Input group",
    "Composition",
    "A field with an addon or an action attached to it.",
    ["InputGroup", "InputGroupAddon", "InputGroupInput"],
    [
      ["children", "ReactNode", "Addon and the input."],
    ],
    "The input still has its own accessible name. The addon is not a placeholder.",
  ),
  ui(
    "carousel",
    "Carousel",
    "Composition",
    "A sideways list of peer items, such as citations.",
    ["Carousel", "CarouselContent", "CarouselItem", "CarouselPrevious", "CarouselNext"],
    [
      ["orientation", "horizontal | vertical", "Scroll direction."],
    ],
    "Previous and next are buttons. Arrow keys move the list when it has focus.",
  ),
  ui(
    "spinner",
    "Spinner",
    "Composition",
    "An indeterminate wait.",
    ["Spinner"],
    [
      ["aria-label", "string", "Defaults to Loading."],
    ],
    "The animation stops under reduced motion. Pair a long wait with text that says what is happening.",
  ),
  ui(
    "toaster",
    "Toaster",
    "Composition",
    "A short confirmation that does not move the page.",
    ["Toaster", "toast"],
    [
      ["toast", "(message) => void", "Shows one notice."],
    ],
    "Mount Toaster once. Use a toast for a completed action. Keep errors that need a decision on the page.",
  ),
  ui(
    "number-ticker",
    "Number ticker",
    "Metrics",
    "A total that counts to the current value.",
    ["NumberTicker"],
    [
      ["value", "number", "The number to show."],
      ["prefix / suffix", "string", "Unit or currency around the digits."],
    ],
    "Reduced motion jumps to the final value. A screen-reader string carries the same number. Blur is off.",
  ),
  ui(
    "series-chart",
    "Series chart",
    "Metrics",
    "A bar or line chart for one shared series contract.",
    ["SeriesChart"],
    [
      ["data", "record[]", "Rows of values."],
      ["xKey", "string", "Category field."],
      ["series", "{ key, label }[]", "The measures to draw."],
      ["kind", "bar | line", "Bar for a mix, line for a value over time."],
      ["caption", "string", "Names the chart for the accessible table."],
    ],
    "The legend can hide a series or show only one. An accessible table repeats the values. Decorative sparklines are not this chart.",
  ),
  ui(
    "workspace-shell",
    "Workspace shell",
    "Patterns",
    "Navigation, a header slot and the main task.",
    ["WorkspaceShell"],
    [
      ["navigation", "ReactNode", "The product's nav."],
      ["header", "ReactNode", "Tools for the current page."],
      ["children", "ReactNode", "The task."],
    ],
    "The host owns routes, the active item, authentication and window chrome. Mail keeps its own panes. Marketing pages do not use this shell.",
  ),
  ui(
    "page-header",
    "Page header",
    "Patterns",
    "The name of the page, a one-line description and the primary action.",
    ["PageHeader"],
    [
      ["title", "ReactNode", "Page heading."],
      ["description", "ReactNode", "What this page is for."],
      ["actions", "ReactNode", "The primary action."],
    ],
    "One page heading. Put the action next to the task it performs.",
  ),
  ui(
    "section-header",
    "Section header",
    "Patterns",
    "The name of a section inside a page.",
    ["SectionHeader"],
    [
      ["title", "ReactNode", "Section heading."],
      ["description", "ReactNode", "Optional supporting line."],
      ["actions", "ReactNode", "Actions for this section only."],
    ],
    "Use it before inventing another heading style.",
  ),
  ui(
    "collection-toolbar",
    "Collection toolbar",
    "Patterns",
    "Search, filters and actions for one collection.",
    ["CollectionToolbar"],
    [
      ["search", "ReactNode", "The search field."],
      ["filters", "ReactNode", "Filters for this collection."],
      ["actions", "ReactNode", "Actions that apply before a selection."],
    ],
    "Keep filters next to the collection they change.",
  ),
  ui(
    "bulk-actions",
    "Bulk actions",
    "Patterns",
    "Actions that appear after the person selects rows.",
    ["BulkActions"],
    [
      ["count", "number", "Selected rows. The bar is hidden at zero."],
      ["children", "ReactNode", "The actions."],
    ],
    "Show the bar only after selection begins. The status names the count.",
  ),
  ui(
    "state-panel",
    "State panel",
    "Patterns",
    "Loading, empty, error, stale and offline states.",
    ["StatePanel"],
    [
      ["state", "loading | empty | error | stale | offline | success", "Which state this is."],
      ["title", "ReactNode", "What happened."],
      ["description", "ReactNode", "What the person can do."],
      ["actions", "ReactNode", "The recovery action."],
    ],
    "A stale observation is not shown as a fresh value. A configured connection is not proof that it can be reached.",
  ),
  ui(
    "confirm-dialog",
    "Confirm dialog",
    "Overlays",
    "Confirm first, then run an async action with a pending state and an inline error.",
    ["ConfirmDialog", "ConfirmActionButton"],
    [
      ["title", "ReactNode", "What will happen."],
      ["description", "ReactNode", "What it affects."],
      ["details", "ReactNode", "Optional list of the affected records."],
      ["confirmLabel", "ReactNode", "Names the action."],
      ["pendingLabel", "ReactNode", "Shown while the action runs."],
      ["destructive", "boolean", "Uses the destructive confirm button."],
      ["onConfirm", "() => Promise", "Resolve { ok: false, error } or throw to keep the dialog open with the error."],
      ["open", "boolean", "ConfirmDialog is controlled with onOpenChange. ConfirmActionButton owns its trigger and state."],
    ],
    "The confirm button shows a spinner while the action runs and cannot be pressed twice. A failure stays inline and keeps the dialog open; success closes it. The host performs the action.",
  ),
  ui(
    "filter-chip",
    "Filter chip",
    "Controls",
    "An active filter with a one-click clear, as a link or a button.",
    ["FilterChip"],
    [
      ["label", "string", "The filter name."],
      ["value", "string", "Its current value."],
      ["href", "string", "Renders a link that clears the filter."],
      ["onRemove", "() => void", "Renders a button that clears the filter."],
      ["clearLabel", "string", "Accessible name of the clear action."],
    ],
    "Pass either href or onRemove. Long values truncate inside the chip. The target is 44px on touch.",
  ),
  ui(
    "truncated-text",
    "Truncated text",
    "Composition",
    "A single line that shows its full text in a tooltip only when it is cut off.",
    ["TruncatedText"],
    [
      ["children", "string", "The full text."],
      ["side", "top | right | bottom | left", "Where the tooltip opens. sideOffset and align refine it."],
    ],
    "The tooltip never intercepts clicks on row actions next to it. Text that fits has no tooltip.",
  ),
  ui(
    "shimmer-text",
    "Shimmer text",
    "Composition",
    "A CSS-only loading label with a light sweep.",
    ["ShimmerText"],
    [
      ["children", "string", "The label."],
      ["as", "ElementType", "Element to render. Defaults to p."],
      ["duration", "number", "Sweep length in seconds. spread sets the highlight width."],
    ],
    "Use it for a short pending label, not for content. Under reduced motion it is plain muted text.",
  ),
  ui(
    "file-thumb",
    "File thumbnail",
    "Collections",
    "An image preview or a file-type tile for file lists.",
    ["FileThumb", "fileTypeLabel"],
    [
      ["src", "string | null", "Image to preview. A broken image falls back to the tile."],
      ["mime", "string | null", "Labels the tile with filename, for example PDF or CSV."],
      ["icon", "ReactNode", "Replaces the default tile icon."],
      ["size", "number", "Square size in pixels."],
      ["alt", "string", "Text alternative for the preview."],
    ],
    "fileTypeLabel returns the same short label for use elsewhere. The host decides which URLs are safe to preview.",
  ),
  ui(
    "recency-groups",
    "Recency groups",
    "Collections",
    "Groups a history by Today, Yesterday, Previous 7 days, Previous 30 days, then month.",
    ["groupByRecency", "RECENCY_LABELS", "TruncatedText"],
    [
      ["items", "readonly T[]", "Records to group, in the order to keep inside each group."],
      ["getDate", "(item) => Date", "Reads the date of one record. Strings and numbers work too."],
      ["now", "Date", "Reference time. Defaults to the current time."],
      ["options", "object", "timeZone, locale and label overrides."],
    ],
    "A helper, not a component. Buckets follow calendar days in the given time zone. The host renders the groups.",
  ),
  ui(
    "settings-section",
    "Settings section",
    "Patterns",
    "A settings row with the title, description and status on the left and the controls on the right.",
    ["SettingsSection"],
    [
      ["title", "ReactNode", "Section heading."],
      ["description", "ReactNode", "What the setting changes."],
      ["status", "ReactNode", "A badge such as Saved, Loading or Error."],
      ["headingLevel", "2 | 3 | 4", "Heading level for the title."],
      ["children", "ReactNode", "The controls."],
    ],
    "The two columns stack on narrow screens. Saving and validation belong to the host.",
  ),
  ui(
    "suggestion-card",
    "Suggestion card",
    "Patterns",
    "Empty-state prompts in a grid on wide screens and a scroll row on narrow ones.",
    ["SuggestionCard", "SuggestionGrid"],
    [
      ["title", "ReactNode", "The prompt."],
      ["description", "ReactNode", "A short explanation. Clamps at two lines."],
      ["icon", "ReactNode", "Optional leading icon."],
      ["onClick", "() => void", "Each card is a button and accepts disabled."],
      ["columns", "1 | 2 | 3 | 4", "SuggestionGrid columns on wide screens."],
    ],
    "Give the grid an aria-label. What a suggestion does is up to the host.",
  ),
  ui(
    "moon-phase",
    "Moon phase",
    "Effects",
    "The moon at a given phase, optionally cycling, with rare moon types and lunar phase helpers.",
    ["MoonPhase", "MOON_VARIANTS", "pickMoonVariant", "lunarPhase", "lunarPhaseName"],
    [
      ["phase", "number", "0 new, 0.5 full, 1 new again."],
      ["animate", "boolean", "Cycles through the phases over cycleMs."],
      ["size", "number | string", "Width and height."],
      ["halo", "boolean", "Glow drawn from the lit side only, so it follows the shadow."],
      ["variant", "id | \"random\"", "Moon type. Random rolls a weighted type at each new moon."],
      ["caption", "boolean", "Shows the type and rarity while it is visible."],
      ["label", "string", "Accessible name. Without it the moon is decorative."],
      ["lunarPhase", "(date) => number", "Phase for a date. lunarPhaseName names it."],
    ],
    "Types: earthshine (crescents), moon halo, harvest, supermoon, micromoon, blue, blood and the legendary super blood moon; full-moon types only show near full. Server code imports the helpers from @fabrials/ui/moon. MoonPhase and Starfield are the only sanctioned glow and continuous motion in Fabrials UI, for sign-in and landing surfaces only. The cycle stops under reduced motion.",
  ),
  ui(
    "starfield",
    "Starfield",
    "Effects",
    "A decorative star layer behind sign-in and landing content.",
    ["Starfield"],
    [
      ["twinkle", "boolean", "Slow twinkle on the far layer."],
      ["className", "string", "Positioning overrides. It fills a positioned parent."],
    ],
    "Hidden from assistive technology and never takes pointer events. Like MoonPhase, it is only for sign-in and landing surfaces, and the twinkle stops under reduced motion.",
  ),
  aiUi(
    "chat-message",
    "Chat message",
    "A user or assistant turn with copy, edit, retry and timestamp actions.",
    ["ChatMessage", "MessageActions", "MessageAction", "CopyMessageAction", "MessageTimestamp"],
    [
      ["from", "ChatRole", "user, assistant or system. User turns sit in a bubble."],
      ["actions", "ReactNode", "MessageActions for this turn."],
      ["pinActions", "boolean", "Keeps actions visible instead of revealing them on hover and focus."],
      ["text", "string", "CopyMessageAction writes it to the clipboard. A function works too."],
      ["dateTime", "string", "MessageTimestamp shows label with detail in a tooltip."],
    ],
    "Presentational. The host supplies the rendered content, including its markdown renderer, and decides what edit and retry do.",
  ),
  aiUi(
    "chat-composer",
    "Chat composer",
    "The message field with tools, attachments, send and stop.",
    ["ChatComposer", "ComposerToggle", "ComposerButton"],
    [
      ["value", "string", "Controlled with onValueChange. defaultValue works uncontrolled."],
      ["onSubmit", "(value) => void", "Enter sends; Shift+Enter adds a line."],
      ["status", "ChatComposerStatus", "ready, submitting or streaming. Streaming turns send into stop, which calls onStop."],
      ["tools", "ReactNode", "ComposerButton and ComposerToggle on the left. trailing holds voice input."],
      ["attachments", "ReactNode", "Attachments shown above the field."],
      ["onPasteFiles", "(files) => void", "Receives pasted files. Backspace in an empty field calls the remove-last handler."],
    ],
    "Presentational. The host sends the message, uploads pasted files and owns the tool state.",
  ),
  aiUi(
    "code-block",
    "Code block and markdown",
    "Answer styles for rendered markdown and a code block with copy and download.",
    ["CodeBlock"],
    [
      ["code", "string", "Raw code used by copy and download."],
      ["language", "string", "Shown in the header and used for the download name."],
      ["children", "ReactNode", "Highlighted lines. Without it the raw code is shown."],
      ["lineNumbers", "boolean", "Numbers each line."],
      ["download", "boolean", "Adds a download action named after filename. A function replaces it."],
      ["fui-markdown", "class", "Styles headings, lists, quotes, tables and code, including Streamdown data-streamdown output."],
    ],
    "Presentational. The host supplies the markdown renderer and syntax highlighting; these pieces only style the result.",
  ),
  aiUi(
    "citations",
    "Citations and sources",
    "Numbered citation chips linked to a list of source cards.",
    ["CitationProvider", "CitationChip", "Sources", "SourceCard", "SourceFavicon"],
    [
      ["sources", "CitationSource[]", "CitationProvider sources by number. Hovering a chip highlights its card."],
      ["number", "number", "CitationChip number and href. Shows a source preview."],
      ["Sources", "component", "Collapsible list of SourceCard links."],
      ["faviconUrl", "(url) => string", "Host resolver for favicons. Without it a letter mark is shown."],
    ],
    "Presentational. The host supplies the sources and any favicon service; nothing is fetched by these components.",
  ),
  aiUi(
    "activity-disclosure",
    "Activity disclosure",
    "Collapsible reasoning, search steps and tool activity inside an answer.",
    ["ActivityDisclosure", "ActivityIcon", "ReasoningDisclosure", "SearchStepsDisclosure"],
    [
      ["streaming", "boolean", "ReasoningDisclosure shows Thinking, then Thought for durationSeconds."],
      ["phase", "SearchPhase", "For search steps: searching, reading or done, with steps and sourceCount."],
      ["live", "boolean", "ActivityDisclosure for any other activity. ActivityIcon marks the live state."],
      ["open", "boolean", "Controlled open state. defaultOpen works uncontrolled."],
    ],
    "Presentational. The host maps its stream events to these props. Live indicators stop under reduced motion.",
  ),
  aiUi(
    "attachments",
    "Attachments",
    "Files attached to a message, inline, as a grid or as a list.",
    ["Attachments", "AttachmentChip"],
    [
      ["items", "AttachmentItem[]", "id, name, mediaType, url, size, status and error."],
      ["variant", "inline | grid | list", "Layout."],
      ["onRemove", "(id) => void", "Shows a remove button on each file."],
      ["empty", "ReactNode", "Shown when there are no files."],
    ],
    "Presentational. The host uploads the files and reports uploading and error states.",
  ),
  aiUi(
    "voice-input",
    "Voice input",
    "A microphone button that records a clip and hands it to the host for transcription.",
    ["VoiceInputButton", "VoiceInputButtonView"],
    [
      ["onRecorded", "(blob) => Promise", "Host transcription. Resolves to the text."],
      ["onTranscript", "(text) => void", "Receives the text to insert."],
      ["maxDurationMs", "number", "Stops recording at this length."],
      ["showLevel", "boolean", "Shows the input level while recording."],
      ["status", "VoiceInputStatus", "idle, requesting, recording, transcribing or error. The stateless view uses it for custom recorders."],
    ],
    "Presentational. The microphone is only requested after a press. The host supplies transcription; nothing is sent by the component.",
  ),
];

export function uiCatalogItem(slug: string): UiCatalogItem | undefined {
  return uiCatalog.find((item) => item.slug === slug);
}
