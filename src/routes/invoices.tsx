import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useStore, money, invoiceSubtotal, invoiceTax, invoiceTotal,
  invoicePaid, invoiceOutstanding, type Invoice, type LineItem, type Payment,
} from "@/lib/store";
import { Plus, Trash2, Eye, CreditCard, Receipt, Pencil, FileText } from "lucide-react";
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

      <DocumentDialog open={!!viewInv} onClose={() => setViewInv(null)} initialLetterhead={viewInv?.prePrintedLetterhead}>
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
  const selectedClient = clients.find((client) => client.id === clientId);
  const [contactPerson, setContactPerson] = useState(editing?.contactPerson ?? selectedClient?.contact ?? "");
  const [trnNo, setTrnNo] = useState(editing?.trnNo ?? selectedClient?.trnNo ?? "");
  const [lpoNo, setLpoNo] = useState(editing?.lpoNo ?? "");
  const [lpoValue, setLpoValue] = useState(editing?.lpoValue ?? 0);
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [prePrintedLetterhead, setPrePrintedLetterhead] = useState(editing?.prePrintedLetterhead ?? false);
  const [items, setItems] = useState<LineItem[]>(
    editing ? editing.items.map((i) => ({ ...i })) : [{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]
  );

  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const subtotal = items.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const tax = subtotal * (settings.vatRate / 100);
  const total = subtotal + tax;

  const selectClient = (id: string) => {
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    setContactPerson(client?.contact ?? "");
    setTrnNo(client?.trnNo ?? "");
  };

  const save = () => {
    if (!clientId || !projectName) { toast.error("Select client and project"); return; }
    onCreate({
      date, dueDate, clientId, projectName, contactPerson, trnNo, notes, prePrintedLetterhead, lpoNo, lpoValue, items,
      taxRate: editing?.taxRate ?? settings.vatRate,
      payments: editing?.payments ?? [],
    });
    if (editing) return;
    setOpen(false);
    setClientId(""); setProjectName(""); setContactPerson(""); setTrnNo(""); setNotes(""); setPrePrintedLetterhead(false); setLpoNo(""); setLpoValue(0);
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose?.(); }}>
      {!editing && (
        <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Invoice</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto rounded-xl border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b bg-modal-accent-soft px-6 py-5 pr-14 text-left">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-modal-accent text-modal-accent-foreground"><FileText className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-xl">{editing ? `Edit Invoice ${editing.no}` : "Create New Invoice"}</DialogTitle>
              <DialogDescription className="mt-1">Fill in details to generate an invoice</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6 px-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Client &amp; Project Details</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2"><Label>Client / Customer Name</Label><Select value={clientId} onValueChange={selectClient}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Contact Person</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>TRN No</Label><Input value={trnNo} maxLength={16} onChange={(e) => setTrnNo(e.target.value.replace(/\D/g, "").slice(0, 16))} inputMode="numeric" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Project Name</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Invoice Number</Label><Input value={editing?.no ?? settings.nextInvoiceNo} readOnly className="bg-muted font-mono" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>LPO / PO Number</Label><Input value={lpoNo} onChange={(e) => setLpoNo(e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>LPO Value ({settings.currency})</Label><Input type="number" min={0} value={lpoValue} onChange={(e) => setLpoValue(+e.target.value)} /></div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
              <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}><Plus className="h-4 w-4" /> Add Item</Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[minmax(280px,1fr)_90px_140px_140px_44px] gap-2 bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"><span>Description</span><span>Qty</span><span>Unit Price</span><span className="text-right">Total</span><span className="sr-only">Delete</span></div>
                <div className="divide-y">
            {items.map((r, i) => (
                  <div key={i} className="grid grid-cols-[minmax(280px,1fr)_90px_140px_140px_44px] gap-2 p-3 items-start">
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
                    <Input type="number" min={0} value={r.qty} onChange={(e) => update(i, { qty: +e.target.value })} />
                    <Input type="number" min={0} value={r.unitPrice} onChange={(e) => update(i, { unitPrice: +e.target.value })} />
                    <div className="h-9 px-3 py-2 text-right text-sm font-medium tabular-nums">{money(r.qty * r.unitPrice, settings.currency)}</div>
                    <Button size="icon" variant="ghost" title="Delete item" className="text-destructive hover:text-destructive" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
            ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Notes / Remarks</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add payment terms, delivery notes, or other remarks..." className="min-h-28 resize-none" /></div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Checkbox checked={prePrintedLetterhead} onCheckedChange={(value) => setPrePrintedLetterhead(value === true)} />Print on pre-printed company letterhead</label>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="mb-3 font-semibold">Summary</div>
              <div className="space-y-3"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{money(subtotal, settings.currency)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">VAT ({settings.vatRate}%)</span><span className="tabular-nums">{money(tax, settings.currency)}</span></div><div className="h-px bg-border" /><div className="flex justify-between text-base font-bold text-modal-accent"><span>Grand Total</span><span className="tabular-nums">{money(total, settings.currency)}</span></div></div>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t bg-muted/40 px-6 py-4">
          <Button variant="secondary" onClick={() => { setOpen(false); onClose?.(); }}>Cancel</Button>
          <Button className="bg-modal-accent text-modal-accent-foreground hover:bg-modal-accent/90" onClick={save}>{editing ? "Save Changes" : "Save Invoice"}</Button>
        </DialogFooter>
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

