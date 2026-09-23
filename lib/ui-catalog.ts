export type UiGroup =
  | "Controls"
  | "Overlays"
  | "Collections"
  | "Navigation"
  | "Composition"
  | "Metrics"
  | "Patterns";

export interface UiCatalogItem {
  slug: string;
  title: string;
  group: UiGroup;
  description: string;
  exports: string[];
  props: [string, string, string][];
  note: string;
  usage: string;
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
];

function ui(
  slug: string,
  title: string,
  group: UiGroup,
  description: string,
  exports: string[],
  props: UiCatalogItem["props"],
  note: string,
): UiCatalogItem {
  return {
    slug,
    title,
    group,
    description,
    exports,
    props,
    note,
    usage: `import { ${exports.join(", ")} } from "@fabrials/ui";`,
  };
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
];

export function uiCatalogItem(slug: string): UiCatalogItem | undefined {
  return uiCatalog.find((item) => item.slug === slug);
}
