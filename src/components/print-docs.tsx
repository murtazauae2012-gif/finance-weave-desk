import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import {
  useStore, money, invoiceSubtotal, invoiceTax, invoiceTotal,
  invoicePaid, invoiceOutstanding, quoteSubtotal, quoteTotal,
  type Invoice, type Quotation, type Payment, type Client,
} from "@/lib/store";

/* ---------- shared sheet chrome ---------- */

function Sheet({ children }: { children: ReactNode }) {
  return (
    <div
      className="print-sheet bg-white text-black mx-auto"
      style={{ width: "210mm", minHeight: "297mm", padding: "14mm", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {children}
    </div>
  );
}

function CompanyHeader({ subtitle }: { subtitle: string }) {
  const { settings } = useStore();
  return (
    <div className="text-center border-b-2 pb-3 mb-4" style={{ borderColor: "#0f766e" }}>
      <div className="text-2xl font-bold tracking-wide uppercase" style={{ color: "#0f766e" }}>
        {settings.companyName}
      </div>
      <div className="text-xs italic mt-0.5">{settings.companyTagline}</div>
      <div className="text-xs mt-1">{settings.companyAddress}</div>
      <div className="text-xs">Phone: {settings.companyPhone} &nbsp;|&nbsp; Email: {settings.companyEmail}</div>
      <div className="mt-3 py-1.5 text-white font-bold tracking-[0.25em] text-sm" style={{ background: "#0f172a" }}>
        {subtitle}
      </div>
    </div>
  );
}

const rowLabel = "text-xs font-semibold uppercase tracking-wide";
const cellHead = "px-2 py-2 text-xs font-bold uppercase tracking-wide text-white";
const cellBody = "px-2 py-1.5 text-[13px] border";
const headBg = { background: "#0f766e" };
const totalBg = { background: "#e6f4f2" };

function SignatureBlock({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid grid-cols-2 gap-8 mt-10 text-xs">
      {[left, right].map((label) => (
        <div key={label} className="text-center">
          <div className="border-t border-black pt-1 mx-4">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- INVOICE ---------- */

export function PrintInvoice({ invoice }: { invoice: Invoice }) {
  const { clients, settings } = useStore();
  const client = clients.find((c) => c.id === invoice.clientId);
  return (
    <Sheet>
      <CompanyHeader subtitle="TAX INVOICE" />

      <div className="mb-2 text-xs font-bold uppercase" style={{ color: "#0f766e" }}>Client &amp; Project Details</div>
      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td className={rowLabel} style={{ width: "22%" }}>Client Name:</td>
            <td style={{ width: "36%" }}>{client?.name}</td>
            <td className={rowLabel} style={{ width: "18%" }}>Invoice No:</td>
            <td style={{ width: "24%" }} className="font-mono">{invoice.no}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Contact Person:</td><td>{client?.contact}</td>
            <td className={rowLabel}>Invoice Date:</td><td>{invoice.date}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Project Name:</td><td>{invoice.projectName}</td>
            <td className={rowLabel}>LPO Number:</td><td className="font-mono">{invoice.lpoNo || "—"}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Site Location:</td><td>{client?.address}</td>
            <td className={rowLabel}>LPO Value:</td>
            <td className="tabular-nums">{invoice.lpoValue ? money(invoice.lpoValue, settings.currency) : "—"}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr style={headBg}>
            <th className={cellHead} style={{ width: "6%" }}>#</th>
            <th className={cellHead + " text-left"}>Description &amp; Specifications</th>
            <th className={cellHead} style={{ width: "8%" }}>Qty</th>
            <th className={cellHead} style={{ width: "10%" }}>Unit</th>
            <th className={cellHead + " text-right"} style={{ width: "14%" }}>Unit Price</th>
            <th className={cellHead + " text-right"} style={{ width: "16%" }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((r, i) => (
            <tr key={i}>
              <td className={cellBody + " text-center"}>{i + 1}</td>
              <td className={cellBody}>{r.description}</td>
              <td className={cellBody + " text-center tabular-nums"}>{r.qty}</td>
              <td className={cellBody + " text-center"}>{r.unit}</td>
              <td className={cellBody + " text-right tabular-nums"}>{money(r.unitPrice, settings.currency)}</td>
              <td className={cellBody + " text-right tabular-nums"}>{money(r.qty * r.unitPrice, settings.currency)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-semibold"}>Subtotal:</td>
            <td className={cellBody + " text-right tabular-nums"}>{money(invoiceSubtotal(invoice), settings.currency)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-semibold"}>VAT ({invoice.taxRate}%):</td>
            <td className={cellBody + " text-right tabular-nums"}>{money(invoiceTax(invoice), settings.currency)}</td>
          </tr>
          <tr style={totalBg}>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-bold uppercase"}>Grand Total:</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(invoiceTotal(invoice), settings.currency)}</td>
          </tr>
          {invoice.payments.length > 0 && (
            <>
              <tr>
                <td colSpan={4} className="border-0"></td>
                <td className={cellBody + " text-right"}>Paid:</td>
                <td className={cellBody + " text-right tabular-nums"} style={{ color: "#0f766e" }}>
                  {money(invoicePaid(invoice), settings.currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border-0"></td>
                <td className={cellBody + " text-right font-semibold"}>Balance Due:</td>
                <td className={cellBody + " text-right tabular-nums font-semibold"}>
                  {money(invoiceOutstanding(invoice), settings.currency)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <div className="mt-6">
        <div className="text-xs font-bold uppercase mb-1" style={{ color: "#0f766e" }}>Bank Payment Details</div>
        <div className="text-[12px] leading-relaxed border p-2" style={{ borderColor: "#0f766e" }}>
          {settings.bankDetails}
          <div className="mt-1 italic">Terms: Payment is due within 14 days of invoice date unless specified otherwise by contract.</div>
        </div>
      </div>

      <SignatureBlock left="Prepared By (Signature & Stamp)" right="Received By (Name & Signature)" />
    </Sheet>
  );
}

/* ---------- QUOTATION ---------- */

export function PrintQuotation({ quotation }: { quotation: Quotation }) {
  const { clients, settings } = useStore();
  const client = clients.find((c) => c.id === quotation.clientId);
  return (
    <Sheet>
      <CompanyHeader subtitle="QUOTATION" />

      <div className="mb-2 text-xs font-bold uppercase" style={{ color: "#0f766e" }}>Client &amp; Project Details</div>
      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td className={rowLabel} style={{ width: "22%" }}>Client Name:</td>
            <td style={{ width: "36%" }}>{client?.name}</td>
            <td className={rowLabel} style={{ width: "18%" }}>Quotation No:</td>
            <td style={{ width: "24%" }} className="font-mono">{quotation.no}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Contact Person:</td><td>{client?.contact}</td>
            <td className={rowLabel}>Date:</td><td>{quotation.date}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Project Name:</td><td>{quotation.projectName}</td>
            <td className={rowLabel}>Valid Until:</td><td>{quotation.validUntil}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Site Location:</td><td colSpan={3}>{client?.address}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr style={headBg}>
            <th className={cellHead} style={{ width: "6%" }}>#</th>
            <th className={cellHead + " text-left"}>Description &amp; Specifications</th>
            <th className={cellHead} style={{ width: "8%" }}>Qty</th>
            <th className={cellHead} style={{ width: "10%" }}>Unit</th>
            <th className={cellHead + " text-right"} style={{ width: "14%" }}>Unit Price</th>
            <th className={cellHead + " text-right"} style={{ width: "16%" }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((r, i) => (
            <tr key={i}>
              <td className={cellBody + " text-center"}>{i + 1}</td>
              <td className={cellBody}>{r.description}</td>
              <td className={cellBody + " text-center tabular-nums"}>{r.qty}</td>
              <td className={cellBody + " text-center"}>{r.unit}</td>
              <td className={cellBody + " text-right tabular-nums"}>{money(r.unitPrice, settings.currency)}</td>
              <td className={cellBody + " text-right tabular-nums"}>{money(r.qty * r.unitPrice, settings.currency)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-semibold"}>Subtotal:</td>
            <td className={cellBody + " text-right tabular-nums"}>{money(quoteSubtotal(quotation), settings.currency)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-semibold"}>VAT ({quotation.taxRate}%):</td>
            <td className={cellBody + " text-right tabular-nums"}>{money(quoteSubtotal(quotation) * quotation.taxRate / 100, settings.currency)}</td>
          </tr>
          <tr style={totalBg}>
            <td colSpan={4} className="border-0"></td>
            <td className={cellBody + " text-right font-bold uppercase"}>Grand Total:</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(quoteTotal(quotation), settings.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6">
        <div className="text-xs font-bold uppercase mb-1" style={{ color: "#0f766e" }}>Terms &amp; Conditions</div>
        <ol className="text-[12px] leading-relaxed list-decimal pl-5 space-y-1">
          <li>Payment Terms: 50% Advance Payment upon signing | 40% upon material delivery to site | 10% upon final hand-over.</li>
          <li>Scope Validity: This quotation covers only the items explicitly listed above. Any site variations will be charged separately.</li>
          <li>Work Site: Prices assume clear and unconditional access to the installation area. Civil work delays will extend the timeline.</li>
          <li>Validity Period: This quotation is valid until {quotation.validUntil}.</li>
        </ol>
      </div>

      <SignatureBlock left="Authorized Signature & Stamp" right="Client Acceptance Signature" />
    </Sheet>
  );
}

/* ---------- PAYMENT RECEIPT VOUCHER ---------- */

const numToWords = (n: number, cur: string): string => {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const g = ["","Thousand","Million","Billion"];
  const num = Math.floor(n);
  if (num === 0) return `Zero ${cur} Only`;
  const chunk = (x: number): string => {
    if (x === 0) return "";
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    return a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + chunk(x % 100) : "");
  };
  let out = "", i = 0, x = num;
  while (x > 0) {
    const c = x % 1000;
    if (c) out = chunk(c) + (g[i] ? " " + g[i] : "") + (out ? " " + out : "");
    x = Math.floor(x / 1000); i++;
  }
  const dec = Math.round((n - num) * 100);
  return `${out} ${cur}${dec ? ` and ${dec}/100` : ""} Only`;
};

export function PrintVoucher({ invoice, payment }: { invoice: Invoice; payment: Payment }) {
  const { clients, settings } = useStore();
  const client = clients.find((c) => c.id === invoice.clientId);
  return (
    <Sheet>
      <CompanyHeader subtitle="PAYMENT RECEIPT VOUCHER" />

      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td colSpan={2}></td>
            <td className={rowLabel} style={{ width: "18%" }}>Voucher No:</td>
            <td style={{ width: "22%" }} className="font-mono">{payment.voucherNo}</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td className={rowLabel}>Date:</td><td>{payment.date}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td className={rowLabel} style={{ width: "18%" }}>Received From:</td>
            <td style={{ width: "32%" }}>{client?.name}</td>
            <td className={rowLabel} style={{ width: "18%" }}>Project Name:</td>
            <td style={{ width: "32%" }}>{invoice.projectName}</td>
          </tr>
          <tr>
            <td className={rowLabel}>The Sum Of:</td>
            <td className="italic">{numToWords(payment.amount, settings.currency)}</td>
            <td className={rowLabel}>LPO / PO Ref:</td>
            <td className="font-mono">{invoice.lpoNo || "—"}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Invoice Ref:</td>
            <td className="font-mono">{invoice.no}</td>
            <td className={rowLabel}>Invoice Total:</td>
            <td className="tabular-nums">{money(invoiceTotal(invoice), settings.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-2 text-xs font-bold uppercase" style={{ color: "#0f766e" }}>Payment Method</div>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr style={headBg}>
            <th className={cellHead + " text-left"}>Payment Mode</th>
            <th className={cellHead + " text-left"}>Cheque / Ref No.</th>
            <th className={cellHead + " text-left"}>Bank Name</th>
            <th className={cellHead + " text-left"}>Date</th>
            <th className={cellHead + " text-right"}>Amount Received</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cellBody}>{payment.mode}</td>
            <td className={cellBody + " font-mono"}>{payment.voucherNo}</td>
            <td className={cellBody}>{payment.bank}</td>
            <td className={cellBody}>{payment.date}</td>
            <td className={cellBody + " text-right tabular-nums"}>{money(payment.amount, settings.currency)}</td>
          </tr>
          <tr style={totalBg}>
            <td colSpan={4} className={cellBody + " text-right font-bold uppercase"}>Total Received:</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(payment.amount, settings.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-[12px]">
        <span className={rowLabel}>Remarks / Notes: </span>
        Payment received against Invoice {invoice.no} for project "{invoice.projectName}".
      </div>

      <SignatureBlock left="Received By (Cashier / Accountant)" right="Approved By (Manager)" />
    </Sheet>
  );
}

/* ---------- STATEMENT OF ACCOUNT ---------- */

export function PrintStatement({ client }: { client: Client }) {
  const { invoices, settings } = useStore();
  const clientInvs = invoices.filter((i) => i.clientId === client.id).sort((a, b) => a.date.localeCompare(b.date));

  interface Row {
    date: string; project: string; invoiceRef: string; lpoNo: string; quoteRef: string;
    lpoAmount: number; billed: number; paid: number; balance: number;
  }
  const rows: Row[] = [];
  clientInvs.forEach((iv) => {
    const t = invoiceTotal(iv);
    rows.push({
      date: iv.date, project: iv.projectName, invoiceRef: iv.no,
      lpoNo: iv.lpoNo, quoteRef: "—",
      lpoAmount: iv.lpoValue, billed: t, paid: 0, balance: 0,
    });
    iv.payments.forEach((p) => {
      rows.push({
        date: p.date, project: iv.projectName, invoiceRef: `${iv.no} · ${p.voucherNo}`,
        lpoNo: iv.lpoNo, quoteRef: "—",
        lpoAmount: 0, billed: 0, paid: p.amount, balance: 0,
      });
    });
  });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  let bal = 0;
  rows.forEach((r) => { bal += r.billed - r.paid; r.balance = bal; });

  const totalLpo = clientInvs.reduce((s, i) => s + (i.lpoValue || invoiceTotal(i)), 0);
  const totalBilled = clientInvs.reduce((s, i) => s + invoiceTotal(i), 0);
  const totalPaid = clientInvs.reduce((s, i) => s + invoicePaid(i), 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <Sheet>
      <CompanyHeader subtitle="STATEMENT OF CUSTOMER ACCOUNT" />

      <div className="mb-2 text-xs font-bold uppercase" style={{ color: "#0f766e" }}>Customer Details</div>
      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td className={rowLabel} style={{ width: "18%" }}>Client Name:</td>
            <td style={{ width: "40%" }}>{client.name}</td>
            <td className={rowLabel} style={{ width: "18%" }}>Statement Date:</td>
            <td style={{ width: "24%" }}>{new Date().toISOString().slice(0, 10)}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Contact Person:</td><td>{client.contact}</td>
            <td className={rowLabel}>Account Status:</td>
            <td className="font-semibold" style={{ color: outstanding > 0 ? "#b45309" : "#0f766e" }}>
              {outstanding > 0 ? "OUTSTANDING" : "SETTLED"}
            </td>
          </tr>
          <tr>
            <td className={rowLabel}>Email / Phone:</td>
            <td colSpan={3}>{client.email} / {client.phone}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr style={headBg}>
            <th className={cellHead}>Total LPO Amount</th>
            <th className={cellHead}>Total Paid to Date</th>
            <th className={cellHead}>Outstanding Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr style={totalBg}>
            <td className={cellBody + " text-center tabular-nums font-bold"}>{money(totalLpo, settings.currency)}</td>
            <td className={cellBody + " text-center tabular-nums font-bold"} style={{ color: "#0f766e" }}>
              {money(totalPaid, settings.currency)}
            </td>
            <td className={cellBody + " text-center tabular-nums font-bold"} style={{ color: "#b45309" }}>
              {money(outstanding, settings.currency)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr style={headBg}>
            <th className={cellHead + " text-left"}>Doc Date</th>
            <th className={cellHead + " text-left"}>Project Name</th>
            <th className={cellHead + " text-left"}>Invoice / Voucher</th>
            <th className={cellHead + " text-left"}>LPO No.</th>
            <th className={cellHead + " text-right"}>LPO Amount</th>
            <th className={cellHead + " text-right"}>Invoice Billed</th>
            <th className={cellHead + " text-right"}>Paid Amount</th>
            <th className={cellHead + " text-right"}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className={cellBody}>{r.date}</td>
              <td className={cellBody}>{r.project}</td>
              <td className={cellBody + " font-mono text-[11px]"}>{r.invoiceRef}</td>
              <td className={cellBody + " font-mono text-[11px]"}>{r.lpoNo || "—"}</td>
              <td className={cellBody + " text-right tabular-nums"}>{r.lpoAmount ? money(r.lpoAmount, settings.currency) : "—"}</td>
              <td className={cellBody + " text-right tabular-nums"}>{r.billed ? money(r.billed, settings.currency) : "—"}</td>
              <td className={cellBody + " text-right tabular-nums"} style={{ color: r.paid ? "#0f766e" : undefined }}>
                {r.paid ? money(r.paid, settings.currency) : "—"}
              </td>
              <td className={cellBody + " text-right tabular-nums font-semibold"}>{money(r.balance, settings.currency)}</td>
            </tr>
          ))}
          <tr style={totalBg}>
            <td colSpan={4} className={cellBody + " text-right font-bold uppercase"}>Total Summary:</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(totalLpo, settings.currency)}</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(totalBilled, settings.currency)}</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(totalPaid, settings.currency)}</td>
            <td className={cellBody + " text-right tabular-nums font-bold"}>{money(outstanding, settings.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-[11px]">
        <div className="font-bold uppercase mb-1" style={{ color: "#0f766e" }}>Important Notes:</div>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>This statement reflects all finalized invoices and partial or full payment receipts allocated against active LPOs.</li>
          <li>'Paid Amount' column shows breakdown adjustments per installment.</li>
          <li>Any discrepancy must be reported to our accounts department within 7 business working days.</li>
        </ol>
      </div>

      <SignatureBlock left="Prepared By (Finance Dept)" right="Confirmed By (Customer Audit)" />
    </Sheet>
  );
}

/* ---------- Dialog wrapper ---------- */

export function DocumentDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[220mm] max-h-[95vh] overflow-y-auto p-4 bg-neutral-100">
        {children}
        <DialogFooter className="no-print sticky bottom-0 bg-neutral-100 pt-2">
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4" /> Close</Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / Save PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}