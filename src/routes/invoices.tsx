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
import { Plus, Trash2, Eye, CreditCard, Receipt, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentDialog, PrintInvoice, PrintVoucher } from "@/components/print-docs";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({ component: Invoices });

function Invoices() {
  const { invoices, clients, products, settings, addInvoice, updateInvoice, deleteInvoice, addPayment } = useStore();
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [payInv, setPayInv] = useState<Invoice | null>(null);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [delInv, setDelInv] = useState<Invoice | null>(null);
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
                          <Button size="sm" variant="ghost" title="Edit invoice" onClick={() => setEditInv(iv)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" title="Delete invoice" className="text-destructive hover:text-destructive" onClick={() => setDelInv(iv)}><Trash2 className="h-4 w-4" /></Button>
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
      {editInv && (
        <NewInvoiceDialog
          key={editInv.id}
          editing={editInv}
          onClose={() => setEditInv(null)}
          onCreate={(payload) => { updateInvoice(editInv.id, payload); toast.success("Invoice updated"); setEditInv(null); }}
        />
      )}
      <AlertDialog open={!!delInv} onOpenChange={(o) => !o && setDelInv(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice {delInv?.no}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and all its recorded payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delInv) { deleteInvoice(delInv.id); toast.success("Invoice deleted"); } setDelInv(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NewInvoiceDialog({ onCreate, editing, onClose }: {
  onCreate: (i: Omit<Invoice, "id" | "no">) => void;
  editing?: Invoice;
  onClose?: () => void;
}) {
  const { clients, products, settings } = useStore();
  const [open, setOpen] = useState(!!editing);
  const [clientId, setClientId] = useState(editing?.clientId ?? "");
  const [projectName, setProjectName] = useState(editing?.projectName ?? "");
  const [lpoNo, setLpoNo] = useState(editing?.lpoNo ?? "");
  const [lpoValue, setLpoValue] = useState(editing?.lpoValue ?? 0);
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<LineItem[]>(
    editing ? editing.items.map((i) => ({ ...i })) : [{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]
  );

  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const subtotal = items.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const tax = subtotal * (settings.vatRate / 100);
  const total = subtotal + tax;

  const save = () => {
    if (!clientId || !projectName) { toast.error("Select client and project"); return; }
    onCreate({
      date, clientId, projectName, lpoNo, lpoValue, items,
      taxRate: editing?.taxRate ?? settings.vatRate,
      payments: editing?.payments ?? [],
    });
    if (editing) return;
    setOpen(false);
    setClientId(""); setProjectName(""); setLpoNo(""); setLpoValue(0);
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose?.(); }}>
      {!editing && (
        <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Invoice</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? `Edit Invoice ${editing.no}` : "Create Tax Invoice"}</DialogTitle></DialogHeader>
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
                  <div className="flex flex-col gap-1">
                    <Input
                      value={r.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Type description or pick a product below..."
                    />
                    <Select onValueChange={(v) => {
                      const p = products.find((x) => x.id === v);
                      if (p) update(i, { description: p.name, unit: p.unit ?? r.unit, unitPrice: p.price ?? r.unitPrice });
                    }}>
                      <SelectTrigger className="h-8 text-xs text-muted-foreground bg-muted/50">
                        <SelectValue placeholder="— Select from product list (optional) —" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} — {money(p.price, settings.currency)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

        <DialogFooter><Button onClick={save}>{editing ? "Save Changes" : "Save Invoice"}</Button></DialogFooter>
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

