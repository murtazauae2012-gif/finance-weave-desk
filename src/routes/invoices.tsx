import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useStore, money, invoiceSubtotal, invoiceTax, invoiceTotal,
  invoicePaid, invoiceOutstanding, type Invoice, type LineItem, type Payment,
} from "@/lib/store";
import { Plus, Trash2, Eye, CreditCard, Receipt } from "lucide-react";
import { DocumentDialog, PrintInvoice, PrintVoucher } from "@/components/print-docs";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({ component: Invoices });

function Invoices() {
  const { invoices, clients, products, settings, addInvoice, addPayment } = useStore();
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [payInv, setPayInv] = useState<Invoice | null>(null);
  const [voucherOf, setVoucherOf] = useState<{ invoice: Invoice; payment: Payment } | null>(null);

  return (
    <div>
      <PageHeader title="Invoices" description="Tax invoices linked to clients, projects and LPOs.">
        <NewInvoiceDialog onCreate={(payload) => { addInvoice(payload); toast.success("Invoice created"); }} />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice No</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Client / Project</th>
                  <th className="px-4 py-3 text-left">LPO</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((iv) => {
                  const c = clients.find((x) => x.id === iv.clientId);
                  const out = invoiceOutstanding(iv);
                  return (
                    <tr key={iv.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{iv.no}</td>
                      <td className="px-4 py-3">{iv.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{c?.name}</div>
                        <div className="text-xs text-muted-foreground">{iv.projectName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{iv.lpoNo || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(invoiceTotal(iv), settings.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-success">{money(invoicePaid(iv), settings.currency)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={out === 0 ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                          {money(out, settings.currency)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setPayInv(iv)}><CreditCard className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setViewInv(iv)}><Eye className="h-4 w-4" /></Button>
                          {iv.payments.length > 0 && (
                            <Button size="sm" variant="ghost" title="Print latest voucher"
                              onClick={() => setVoucherOf({ invoice: iv, payment: iv.payments[iv.payments.length - 1] })}>
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DocumentDialog open={!!viewInv} onClose={() => setViewInv(null)}>
        {viewInv && <PrintInvoice invoice={viewInv} />}
      </DocumentDialog>
      <DocumentDialog open={!!voucherOf} onClose={() => setVoucherOf(null)}>
        {voucherOf && <PrintVoucher invoice={voucherOf.invoice} payment={voucherOf.payment} />}
      </DocumentDialog>
      {payInv && (
        <PaymentDialog
          invoice={payInv}
          onClose={() => setPayInv(null)}
          onSave={(p) => { addPayment(payInv.id, p); toast.success("Payment recorded"); setPayInv(null); }}
        />
      )}
    </div>
  );
}

function NewInvoiceDialog({ onCreate }: { onCreate: (i: Omit<Invoice, "id" | "no">) => void }) {
  const { clients, products, settings } = useStore();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [lpoNo, setLpoNo] = useState("");
  const [lpoValue, setLpoValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<LineItem[]>([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);

  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const subtotal = items.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const tax = subtotal * (settings.vatRate / 100);
  const total = subtotal + tax;

  const save = () => {
    if (!clientId || !projectName) { toast.error("Select client and project"); return; }
    onCreate({ date, clientId, projectName, lpoNo, lpoValue, items, taxRate: settings.vatRate, payments: [] });
    setOpen(false);
    setClientId(""); setProjectName(""); setLpoNo(""); setLpoValue(0);
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Invoice</Button></DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Tax Invoice</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div>
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Project Name</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
          <div><Label>LPO / PO Number</Label><Input value={lpoNo} onChange={(e) => setLpoNo(e.target.value)} /></div>
          <div className="col-span-2"><Label>LPO Value ({settings.currency})</Label><Input type="number" value={lpoValue} onChange={(e) => setLpoValue(+e.target.value)} /></div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Line Items</Label>
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}><Plus className="h-3 w-3" /> Row</Button>
          </div>
          <div className="space-y-2">
            {items.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Select value={r.description} onValueChange={(v) => {
                    const p = products.find((x) => x.name === v);
                    update(i, { description: v, unit: p?.unit ?? r.unit, unitPrice: p?.price ?? r.unitPrice });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select product or type" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input className="col-span-2" type="number" value={r.qty} onChange={(e) => update(i, { qty: +e.target.value })} placeholder="Qty" />
                <Input className="col-span-2" value={r.unit} onChange={(e) => update(i, { unit: e.target.value })} placeholder="Unit" />
                <Input className="col-span-2" type="number" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: +e.target.value })} placeholder="Price" />
                <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-md bg-muted"><div className="text-xs text-muted-foreground">Subtotal</div><div className="font-semibold tabular-nums">{money(subtotal, settings.currency)}</div></div>
          <div className="p-3 rounded-md bg-muted"><div className="text-xs text-muted-foreground">VAT ({settings.vatRate}%)</div><div className="font-semibold tabular-nums">{money(tax, settings.currency)}</div></div>
          <div className="p-3 rounded-md bg-primary text-primary-foreground"><div className="text-xs opacity-80">Grand Total</div><div className="font-bold tabular-nums">{money(total, settings.currency)}</div></div>
        </div>

        <DialogFooter><Button onClick={save}>Save Invoice</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ invoice, onClose, onSave }: { invoice: Invoice; onClose: () => void; onSave: (p: Payment) => void }) {
  const { settings } = useStore();
  const [voucherNo, setVoucherNo] = useState(`PV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("Bank Transfer");
  const [bank, setBank] = useState("Emirates NBD");
  const [amount, setAmount] = useState(0);
  const out = invoiceOutstanding(invoice);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Partial Payment</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Invoice {invoice.no} · Outstanding {money(out, settings.currency)}
          </p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Voucher No</Label><Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} /></div>
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div>
            <Label>Payment Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Bank Transfer","Cheque","Cash","Credit Card"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Bank Name</Label><Input value={bank} onChange={(e) => setBank(e.target.value)} /></div>
          <div className="col-span-2"><Label>Amount ({settings.currency})</Label><Input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => amount > 0 && onSave({ voucherNo, date, mode, bank, amount })}>Save Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceViewer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { clients, settings } = useStore();
  const client = clients.find((c) => c.id === invoice.clientId);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <div className="p-2">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary">{settings.companyName}</h2>
              <p className="text-xs text-muted-foreground mt-1">TAX INVOICE</p>
            </div>
            <div className="text-right text-sm">
              <div className="font-mono font-semibold">{invoice.no}</div>
              <div className="text-muted-foreground">{invoice.date}</div>
              {invoice.lpoNo && <div className="text-xs mt-1">LPO: {invoice.lpoNo}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Bill To</div>
              <div className="font-semibold">{client?.name}</div>
              <div>{client?.contact}</div>
              <div className="text-muted-foreground">{client?.address}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Project</div>
              <div className="font-semibold">{invoice.projectName}</div>
            </div>
          </div>
          <table className="w-full text-sm border">
            <thead className="bg-muted"><tr>
              <th className="text-left p-2">Description</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-left p-2">Unit</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-right p-2">Amount</th>
            </tr></thead>
            <tbody>
              {invoice.items.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{r.description}</td>
                  <td className="p-2 text-right tabular-nums">{r.qty}</td>
                  <td className="p-2">{r.unit}</td>
                  <td className="p-2 text-right tabular-nums">{money(r.unitPrice, settings.currency)}</td>
                  <td className="p-2 text-right tabular-nums">{money(r.qty * r.unitPrice, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(invoiceSubtotal(invoice), settings.currency)}</span></div>
              <div className="flex justify-between"><span>VAT {invoice.taxRate}%</span><span className="tabular-nums">{money(invoiceTax(invoice), settings.currency)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total</span><span className="tabular-nums">{money(invoiceTotal(invoice), settings.currency)}</span></div>
              <div className="flex justify-between text-success"><span>Paid</span><span className="tabular-nums">{money(invoicePaid(invoice), settings.currency)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance Due</span><span className="tabular-nums">{money(invoiceOutstanding(invoice), settings.currency)}</span></div>
            </div>
          </div>
          {invoice.payments.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase text-muted-foreground mb-2">Payments Received</div>
              <table className="w-full text-xs border">
                <thead className="bg-muted"><tr>
                  <th className="text-left p-2">Voucher</th><th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Mode</th><th className="text-left p-2">Bank</th>
                  <th className="text-right p-2">Amount</th>
                </tr></thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono">{p.voucherNo}</td>
                      <td className="p-2">{p.date}</td><td className="p-2">{p.mode}</td>
                      <td className="p-2">{p.bank}</td>
                      <td className="p-2 text-right tabular-nums">{money(p.amount, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">Bank Details</div>{settings.bankDetails}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}