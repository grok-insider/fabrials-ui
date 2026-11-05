import type { GemName } from "@fabrials/ui";

// Synthetic data shared by the three identity proposals, so each direction
// shows the same two screens: the fabrials.com landing and a product overview
// (Palanaeum, the local mail steward).

export type Product = {
  name: string;
  gem: GemName;
  line: string;
  runs: string;
  state: string;
  link: string;
};

export const products: Product[] = [
  { name: "Spanreed", gem: "ruby", line: "What your AI coding subscriptions use and cost, from the terminal or the tray.", runs: "macOS, Linux, Windows", state: "0.7.2", link: "Install Spanreed" },
  { name: "Syl", gem: "sapphire", line: "Lets your agents drive and test desktop, browser and Android apps.", runs: "Linux, Windows", state: "0.1.0", link: "Read the Syl docs" },
  { name: "ai.fabrials.com", gem: "amethyst", line: "A hosted relay for Grok, Cursor and Nous, with limits per key.", runs: "Hosted", state: "Online", link: "Open the relay" },
  { name: "Usage AI", gem: "heliodor", line: "Weekly numbers from Spanreed users who choose to share them.", runs: "Open data", state: "Week 45", link: "See this week" },
  { name: "Fabrials UI", gem: "zircon", line: "The design system and shadcn registry these pages are built with.", runs: "npm, registry", state: "0.9.0", link: "Open Fabrials UI" },
];

export const week = {
  label: "Week 45, 2026",
  totals: [
    { label: "Shared snapshots", value: "1,284", unit: "" },
    { label: "Requests priced", value: "3.9", unit: "M" },
    { label: "Median cost per day", value: "$4.12", unit: "" },
  ],
  // Requests per day, Monday first (thousands).
  days: [412, 538, 601, 577, 649, 318, 244],
};

export type Stat = { label: string; value: string; unit?: string; note: string; share: number };

export const stats: Stat[] = [
  { label: "Messages indexed", value: "28,714", note: "3 accounts", share: 1 },
  { label: "Unread", value: "6,102", note: "21% of indexed", share: 0.21 },
  { label: "Senders", value: "1,206", note: "318 send bulk mail", share: 0.26 },
  { label: "Bulk mail", value: "19,930", note: "69% of indexed", share: 0.69 },
];

// Messages received per day over the last 14 days: bulk and personal.
export const daily: { day: string; bulk: number; personal: number }[] = [
  { day: "Oct 23", bulk: 142, personal: 38 },
  { day: "Oct 24", bulk: 168, personal: 41 },
  { day: "Oct 25", bulk: 96, personal: 22 },
  { day: "Oct 26", bulk: 88, personal: 17 },
  { day: "Oct 27", bulk: 151, personal: 44 },
  { day: "Oct 28", bulk: 173, personal: 52 },
  { day: "Oct 29", bulk: 160, personal: 47 },
  { day: "Oct 30", bulk: 181, personal: 39 },
  { day: "Oct 31", bulk: 149, personal: 35 },
  { day: "Nov 1", bulk: 92, personal: 19 },
  { day: "Nov 2", bulk: 84, personal: 15 },
  { day: "Nov 3", bulk: 166, personal: 49 },
  { day: "Nov 4", bulk: 188, personal: 56 },
  { day: "Nov 5", bulk: 121, personal: 31 },
];

export type Sender = { name: string; address: string; messages: number; unread: number; last: string; unsubscribe: "One-click" | "By email" | "Link" | "None" };

export const senders: Sender[] = [
  { name: "Northwind Weekly", address: "weekly@news.northwind.example", messages: 1874, unread: 1502, last: "3 hours ago", unsubscribe: "One-click" },
  { name: "Contoso Deals", address: "deals@mail.contoso.example", messages: 1611, unread: 1590, last: "Yesterday", unsubscribe: "One-click" },
  { name: "Forum digest", address: "digest@forum.example", messages: 929, unread: 412, last: "Nov 2", unsubscribe: "By email" },
  { name: "Fabrikam Updates", address: "updates@fabrikam.example", messages: 727, unread: 18, last: "Oct 29", unsubscribe: "Link" },
  { name: "Bank alerts", address: "alerts@bank.example", messages: 622, unread: 0, last: "Today", unsubscribe: "None" },
];

export type Account = { name: string; address: string; provider: string; state: "synced" | "syncing" | "error"; detail: string };

export const accounts: Account[] = [
  { name: "Personal", address: "ana@proton.example", provider: "Proton Bridge", state: "synced", detail: "Synced 2 minutes ago" },
  { name: "Work", address: "ana@work.example", provider: "Fastmail", state: "syncing", detail: "Reading INBOX, 61%" },
  { name: "Old", address: "ana.old@mail.example", provider: "IMAP", state: "error", detail: "Password rejected. Update it in Accounts." },
];

export const nav = [
  { group: "Mail", items: [{ label: "Overview", current: true }, { label: "Senders", count: "1,206" }, { label: "Cleanup" }] },
  { group: "Setup", items: [{ label: "Accounts", count: "3" }, { label: "Rules" }] },
];
