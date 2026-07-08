import { createContext, useContext, useState, type ReactNode } from "react";

export type ExpenseCategory = "Material" | "Petrol" | "Rent" | "Other";
export type QuoteStatus = "Draft" | "Sent" | "Approved" | "Rejected";

export interface Client {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  description: string;
}

export interface LineItem {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface Payment {
  voucherNo: string;
  date: string;
  mode: string;
  bank: string;
  amount: number;
}

export interface Invoice {
  id: string;
  no: string;
  date: string;
  clientId: string;
  projectName: string;
  lpoNo: string;
  lpoValue: number;
  items: LineItem[];
  taxRate: number;
  payments: Payment[];
}

export interface Quotation {
  id: string;
  no: string;
  date: string;
  validUntil: string;
  clientId: string;
  projectName: string;
  items: LineItem[];
  taxRate: number;
  status: QuoteStatus;
}

export interface Expense {
  id: string;
  date: string;
  projectId: string | "GENERAL";
  vendor: string;
  category: ExpenseCategory;
  refNo: string;
  amount: number;
  vat: number;
}

export interface Settings {
  companyName: string;
  currency: string;
  vatRate: number;
  bankDetails: string;
  logo: string;
}

// ------- helpers -------
export const money = (n: number, cur = "AED") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(n || 0);

export const invoiceSubtotal = (inv: Invoice) =>
  inv.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const invoiceTax = (inv: Invoice) => invoiceSubtotal(inv) * (inv.taxRate / 100);
export const invoiceTotal = (inv: Invoice) => invoiceSubtotal(inv) + invoiceTax(inv);
export const invoicePaid = (inv: Invoice) => inv.payments.reduce((s, p) => s + p.amount, 0);
export const invoiceOutstanding = (inv: Invoice) => invoiceTotal(inv) - invoicePaid(inv);

export const quoteSubtotal = (q: Quotation) =>
  q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const quoteTotal = (q: Quotation) => quoteSubtotal(q) * (1 + q.taxRate / 100);

export const expenseTotal = (e: Expense) => e.amount + e.vat;

// ------- seed data -------
const seedClients: Client[] = [
  { id: "CL-001", name: "Emirates Marina Developments", contact: "Ahmed Al Marri", phone: "+971 50 445 7821", email: "projects@emiratesmarina.ae", address: "Dubai Marina, Tower 7, UAE" },
  { id: "CL-002", name: "Nakheel Interiors LLC", contact: "Fatima Hussein", phone: "+971 52 334 1187", email: "purchasing@nakheelint.com", address: "Al Quoz Industrial 3, Dubai" },
  { id: "CL-003", name: "Sharjah Facade Contractors", contact: "Rakesh Menon", phone: "+971 55 991 4432", email: "r.menon@sharjahfacade.ae", address: "Industrial Area 12, Sharjah" },
];

const seedProducts: Product[] = [
  { id: "P-001", name: "Slimline Sliding Door Frame", unit: "Sft", price: 185, description: "Aluminum slimline frame, powder coated" },
  { id: "P-002", name: "Double Glazed Glass Panel 8+12+8", unit: "Sft", price: 95, description: "Tempered DGU panel, low-e coated" },
  { id: "P-003", name: "Custom Structural Bracket", unit: "Pcs", price: 45, description: "Fabricated MS bracket, galvanized" },
  { id: "P-004", name: "Site Installation Labor", unit: "Job", price: 2500, description: "Full crew installation service" },
  { id: "P-005", name: "Aluminum Curtain Wall System", unit: "Sft", price: 220, description: "Unitised curtain wall, thermal break" },
];

const seedInvoices: Invoice[] = [
  {
    id: "IV-1", no: "20260215-INV01", date: "2026-02-15",
    clientId: "CL-001", projectName: "Marina Tower 7 - Facade Package",
    lpoNo: "LPO-EMD-2026-014", lpoValue: 340000,
    items: [
      { description: "Aluminum Curtain Wall System", qty: 850, unit: "Sft", unitPrice: 220 },
      { description: "Site Installation Labor", qty: 1, unit: "Job", unitPrice: 42000 },
    ],
    taxRate: 5,
    payments: [
      { voucherNo: "PV-2201", date: "2026-03-02", mode: "Bank Transfer", bank: "Emirates NBD", amount: 120000 },
      { voucherNo: "PV-2244", date: "2026-04-11", mode: "Cheque", bank: "ADCB", amount: 80000 },
    ],
  },
  {
    id: "IV-2", no: "20260318-INV02", date: "2026-03-18",
    clientId: "CL-002", projectName: "Palm Villa 42 - Sliding Doors",
    lpoNo: "LPO-NAK-042", lpoValue: 118000,
    items: [
      { description: "Slimline Sliding Door Frame", qty: 420, unit: "Sft", unitPrice: 185 },
      { description: "Double Glazed Glass Panel 8+12+8", qty: 380, unit: "Sft", unitPrice: 95 },
      { description: "Site Installation Labor", qty: 1, unit: "Job", unitPrice: 4200 },
    ],
    taxRate: 5,
    payments: [
      { voucherNo: "PV-3110", date: "2026-04-05", mode: "Bank Transfer", bank: "Emirates NBD", amount: 60000 },
    ],
  },
  {
    id: "IV-3", no: "20260428-INV03", date: "2026-04-28",
    clientId: "CL-003", projectName: "SFC Warehouse Skylight",
    lpoNo: "LPO-SFC-2026-008", lpoValue: 76500,
    items: [
      { description: "Custom Structural Bracket", qty: 220, unit: "Pcs", unitPrice: 45 },
      { description: "Double Glazed Glass Panel 8+12+8", qty: 480, unit: "Sft", unitPrice: 95 },
      { description: "Site Installation Labor", qty: 1, unit: "Job", unitPrice: 8500 },
    ],
    taxRate: 5,
    payments: [],
  },
];

const seedQuotations: Quotation[] = [
  {
    id: "QT-1", no: "20260130-QT01", date: "2026-01-30", validUntil: "2026-03-01",
    clientId: "CL-001", projectName: "Marina Tower 7 - Facade Package",
    items: [
      { description: "Aluminum Curtain Wall System", qty: 850, unit: "Sft", unitPrice: 220 },
      { description: "Site Installation Labor", qty: 1, unit: "Job", unitPrice: 42000 },
    ],
    taxRate: 5, status: "Approved",
  },
  {
    id: "QT-2", no: "20260305-QT02", date: "2026-03-05", validUntil: "2026-04-05",
    clientId: "CL-002", projectName: "Palm Villa 42 - Sliding Doors",
    items: [
      { description: "Slimline Sliding Door Frame", qty: 420, unit: "Sft", unitPrice: 185 },
      { description: "Double Glazed Glass Panel 8+12+8", qty: 380, unit: "Sft", unitPrice: 95 },
    ],
    taxRate: 5, status: "Approved",
  },
  {
    id: "QT-3", no: "20260510-QT03", date: "2026-05-10", validUntil: "2026-06-10",
    clientId: "CL-003", projectName: "SFC Office Partition Upgrade",
    items: [
      { description: "Slimline Sliding Door Frame", qty: 220, unit: "Sft", unitPrice: 185 },
    ],
    taxRate: 5, status: "Sent",
  },
  {
    id: "QT-4", no: "20260612-QT04", date: "2026-06-12", validUntil: "2026-07-12",
    clientId: "CL-001", projectName: "Marina Retail Storefront",
    items: [
      { description: "Aluminum Curtain Wall System", qty: 180, unit: "Sft", unitPrice: 220 },
    ],
    taxRate: 5, status: "Draft",
  },
];

const seedExpenses: Expense[] = [
  { id: "EX-001", date: "2026-02-18", projectId: "IV-1", vendor: "Alupco Trading LLC", category: "Material", refNo: "INV-88214", amount: 88500, vat: 4425 },
  { id: "EX-002", date: "2026-02-22", projectId: "IV-1", vendor: "Guardian Glass ME", category: "Material", refNo: "INV-77120", amount: 42300, vat: 2115 },
  { id: "EX-003", date: "2026-02-25", projectId: "IV-1", vendor: "ENOC Station 42", category: "Petrol", refNo: "FR-4471", amount: 850, vat: 42.5 },
  { id: "EX-004", date: "2026-03-01", projectId: "GENERAL", vendor: "Al Quoz Warehouse Mgmt", category: "Rent", refNo: "RNT-MAR26", amount: 18000, vat: 900 },
  { id: "EX-005", date: "2026-03-10", projectId: "IV-2", vendor: "Alupco Trading LLC", category: "Material", refNo: "INV-88891", amount: 34200, vat: 1710 },
  { id: "EX-006", date: "2026-03-15", projectId: "IV-2", vendor: "Emarat Delivery Fuel", category: "Petrol", refNo: "FR-5510", amount: 620, vat: 31 },
  { id: "EX-007", date: "2026-03-20", projectId: "GENERAL", vendor: "DEWA", category: "Other", refNo: "UTIL-MAR", amount: 2400, vat: 120 },
  { id: "EX-008", date: "2026-04-01", projectId: "GENERAL", vendor: "Al Quoz Warehouse Mgmt", category: "Rent", refNo: "RNT-APR26", amount: 18000, vat: 900 },
  { id: "EX-009", date: "2026-04-12", projectId: "IV-3", vendor: "Metal Works FZE", category: "Material", refNo: "INV-11220", amount: 9800, vat: 490 },
  { id: "EX-010", date: "2026-04-18", projectId: "IV-3", vendor: "Guardian Glass ME", category: "Material", refNo: "INV-77441", amount: 22800, vat: 1140 },
  { id: "EX-011", date: "2026-04-22", projectId: "IV-3", vendor: "ENOC Station 42", category: "Petrol", refNo: "FR-6031", amount: 410, vat: 20.5 },
  { id: "EX-012", date: "2026-05-02", projectId: "GENERAL", vendor: "Hilti ME", category: "Other", refNo: "INV-99001", amount: 3600, vat: 180 },
];

const seedSettings: Settings = {
  companyName: "Meridian Fabrications LLC",
  currency: "AED",
  vatRate: 5,
  bankDetails: "Emirates NBD  •  A/C: 1023 4455 6677  •  IBAN: AE12 0260 0010 2344 5566 778",
  logo: "",
};

// ------- context -------
interface Store {
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  expenses: Expense[];
  settings: Settings;
  addClient: (c: Omit<Client, "id">) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  addInvoice: (i: Omit<Invoice, "id" | "no">) => Invoice;
  addPayment: (invoiceId: string, p: Payment) => void;
  addQuotation: (q: Omit<Quotation, "id" | "no">) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  convertQuoteToInvoice: (id: string) => Invoice | null;
  addExpense: (e: Omit<Expense, "id">) => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const StoreCtx = createContext<Store | null>(null);

const pad = (n: number) => String(n).padStart(2, "0");
const todayCode = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState(seedClients);
  const [products, setProducts] = useState(seedProducts);
  const [invoices, setInvoices] = useState(seedInvoices);
  const [quotations, setQuotations] = useState(seedQuotations);
  const [expenses, setExpenses] = useState(seedExpenses);
  const [settings, setSettings] = useState(seedSettings);

  const value: Store = {
    clients, products, invoices, quotations, expenses, settings,
    addClient: (c) => setClients((prev) => [...prev, { ...c, id: `CL-${String(prev.length + 1).padStart(3, "0")}` }]),
    addProduct: (p) => setProducts((prev) => [...prev, { ...p, id: `P-${String(prev.length + 1).padStart(3, "0")}` }]),
    addInvoice: (i) => {
      const no = `${todayCode()}-INV${pad(invoices.length + 1)}`;
      const inv: Invoice = { ...i, id: `IV-${invoices.length + 1}`, no };
      setInvoices((prev) => [...prev, inv]);
      return inv;
    },
    addPayment: (invoiceId, p) =>
      setInvoices((prev) => prev.map((iv) => iv.id === invoiceId ? { ...iv, payments: [...iv.payments, p] } : iv)),
    addQuotation: (q) => {
      const no = `${todayCode()}-QT${pad(quotations.length + 1)}`;
      setQuotations((prev) => [...prev, { ...q, id: `QT-${prev.length + 1}`, no }]);
    },
    updateQuoteStatus: (id, status) =>
      setQuotations((prev) => prev.map((q) => q.id === id ? { ...q, status } : q)),
    convertQuoteToInvoice: (id) => {
      const q = quotations.find((x) => x.id === id);
      if (!q) return null;
      const no = `${todayCode()}-INV${pad(invoices.length + 1)}`;
      const inv: Invoice = {
        id: `IV-${invoices.length + 1}`, no, date: new Date().toISOString().slice(0, 10),
        clientId: q.clientId, projectName: q.projectName, lpoNo: "", lpoValue: quoteTotal(q),
        items: q.items, taxRate: q.taxRate, payments: [],
      };
      setInvoices((prev) => [...prev, inv]);
      return inv;
    },
    addExpense: (e) => setExpenses((prev) => [...prev, { ...e, id: `EX-${String(prev.length + 1).padStart(3, "0")}` }]),
    updateSettings: (s) => setSettings((prev) => ({ ...prev, ...s })),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore must be inside StoreProvider");
  return s;
}
