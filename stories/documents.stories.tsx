import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dropzone, Spreadsheet, type Workbook } from "@fabrials/ui";
import { readSpreadsheet, SpreadsheetError } from "@fabrials/ui/spreadsheet";
import { Block, Page } from "./story-frame";

const meta = {
  title: "Fabrials/Documents",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const ACCOUNTS = ["North workspace", "Harbour lab", "Field office", "Night shift", "Orchard studio", "Quarry records"];

// Synthetic: a usage export as a reader would hand it over (values plus the text the file showed).
const BOOK: Workbook = {
  sheets: [
    {
      name: "Usage",
      frozen: { rows: 1, columns: 1 },
      columnWidths: [170, 96, 110, 80, 110, 70],
      rows: [
        ["Account", "Requests", "Cost", "Share", "Since", "Active"],
        ...Array.from({ length: 240 }, (_, index) => {
          const requests = 900 + ((index * 7919) % 41000);
          return [
            `${ACCOUNTS[index % ACCOUNTS.length]} ${Math.floor(index / ACCOUNTS.length) + 1}`,
            { value: requests, text: requests.toLocaleString("en-GB") },
            { value: requests * 0.03, text: `€${(requests * 0.03).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { value: requests / 100000, text: `${((requests / 100000) * 100).toFixed(1)}%` },
            { value: new Date(Date.UTC(2025, index % 12, 1 + (index % 27))), text: new Date(Date.UTC(2025, index % 12, 1 + (index % 27))).toISOString().slice(0, 10) },
            index % 5 !== 0,
          ];
        }),
        [],
        ["Total", { value: 0, text: "1,234,567", formula: "SUM(B2:B241)" }, { value: null, error: "#REF!", formula: "SUM(Archive!C2:C241)" }, "Totals come from the source file."],
      ],
      merges: [{ top: 242, left: 3, bottom: 242, right: 5 }],
    },
    {
      name: "Notes",
      rows: [["Synthetic data for the catalogue."], ["Ünïcode, emoji 🌒 and long text that the cell cuts with an ellipsis rather than wrapping across its neighbours."]],
      columnWidths: [320],
    },
    { name: "Empty", rows: [] },
  ],
};

function SheetsPage() {
  const [opened, setOpened] = useState<{ book: Workbook; name: string } | null>(null);
  const [problem, setProblem] = useState<string | undefined>();
  return (
    <Page
      title="Spreadsheets"
      description="A read-only workbook: letters and row numbers that stay in view, the file's frozen panes, merged cells, the address and contents of the active cell, and sheet tabs. Only the cells on screen are drawn."
    >
      <Block title="A workbook" description="Click a cell or use the arrows; Ctrl+Home and Ctrl+End go to the corners, Ctrl+C copies the cell.">
        <Spreadsheet workbook={BOOK} aria-label="Usage export" height={360} locale="en-GB" />
      </Block>
      <Block title="Open a file" description="CSV, TSV and .xlsx are read in the browser with no dependency. An old .xls is refused with the reason.">
        <Dropzone
          label="Drop a spreadsheet here"
          buttonLabel="Choose a spreadsheet"
          accept=".csv,.tsv,.txt,.xlsx,.xlsm,.xls"
          multiple={false}
          error={problem}
          onFilesChange={async ([file]) => {
            if (!file) return;
            try {
              setOpened({ book: await readSpreadsheet(file, { locale: "en-GB" }), name: file.name });
              setProblem(undefined);
            } catch (error) {
              setOpened(null);
              setProblem(error instanceof SpreadsheetError ? error.message : "The file could not be read.");
            }
          }}
        />
        {opened ? <Spreadsheet workbook={opened.book} aria-label={opened.name} height={320} locale="en-GB" /> : null}
      </Block>
    </Page>
  );
}

export const Sheets: Story = { render: () => <SheetsPage /> };
