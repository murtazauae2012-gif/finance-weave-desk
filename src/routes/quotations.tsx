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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore, money, quoteTotal, type LineItem, type QuoteStatus, type Quotation } from "@/lib/store";
import { Plus, Trash2, ArrowRightCircle, Eye, Pencil, FileText } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentDialog, PrintQuotation } from "@/components/print-docs";
import { toast } from "sonner";

export const Route = createFileRoute("/quotations")({ component: Quotations });

const statusColor: Record<QuoteStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/15 text-primary",
  Approved: "bg-success text-success-foreground",
  Rejected: "bg-destructive text-destructive-foreground",
};

function Quotations() {
  const { quotations, clients, settings, addQuotation, updateQuotation, deleteQuotation, updateQuoteStatus, convertQuoteToInvoice } = useStore();
  const [viewQ, setViewQ] = useState<Quotation | null>(null);
  const [editQ, setEditQ] = useState<Quotation | null>(null);
  const [delQ, setDelQ] = useState<Quotation | null>(null);

  return (
    <div>
      <PageHeader title="Quotations" description="Formal proposals with 1-click conversion to invoice.">
        <QuotationFormDialog
          onSubmit={(payload) => { addQuotation(payload); toast.success("Quotation created"); }}
        />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Quote No</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Valid Until</th>
                  <th className="px-4 py-3 text-left">Customer / Project</th>
                  <th className="px-4 py-3 text-right">Total (incl. VAT)</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotations.map((q) => {
                  const c = clients.find((x) => x.id === q.clientId);
                  return (
                    <tr key={q.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{q.no}</td>
                      <td className="px-4 py-3">{q.date}</td>
                      <td className="px-4 py-3">{q.validUntil}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{c?.name}</div>
                        <div className="text-xs text-muted-foreground">{q.projectName}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(quoteTotal(q), settings.currency)}</td>
                      <td className="px-4 py-3">
                        <Select value={q.status} onValueChange={(v) => updateQuoteStatus(q.id, v as QuoteStatus)}>
                          <SelectTrigger className={`h-8 w-32 ${statusColor[q.status]}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["Draft","Sent","Approved","Rejected"] as QuoteStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewQ(q)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" title="Edit quotation" onClick={() => setEditQ(q)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" title="Delete quotation" className="text-destructive hover:text-destructive" onClick={() => setDelQ(q)}><Trash2 className="h-4 w-4" /></Button>
                          {q.status === "Approved" && (
                            <Button size="sm" variant="outline" onClick={() => {
                              const inv = convertQuoteToInvoice(q.id);
                              if (inv) toast.success(`Created invoice ${inv.no}`);
                            }}>
                              <ArrowRightCircle className="h-4 w-4" /> To Invoice
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

      <DocumentDialog open={!!viewQ} onClose={() => setViewQ(null)} initialLetterhead={viewQ?.prePrintedLetterhead}>
        {viewQ && <PrintQuotation quotation={viewQ} />}
      </DocumentDialog>

      {editQ && (
        <QuotationFormDialog
          key={editQ.id}
          editing={editQ}
          onClose={() => setEditQ(null)}
          onSubmit={(payload) => { updateQuotation(editQ.id, payload); toast.success("Quotation updated"); setEditQ(null); }}
        />
      )}

      <AlertDialog open={!!delQ} onOpenChange={(o) => !o && setDelQ(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quotation {delQ?.no}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the quotation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delQ) { deleteQuotation(delQ.id); toast.success("Quotation deleted"); } setDelQ(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuotationFormDialog({ onSubmit, editing, onClose }: {
  onSubmit: (q: Omit<Quotation, "id" | "no">) => void;
  editing?: Quotation;
  onClose?: () => void;
}) {
  const { clients, products, settings } = useStore();
  const [open, setOpen] = useState(!!editing);
  const [clientId, setClientId] = useState(editing?.clientId ?? "");
  const [projectName, setProjectName] = useState(editing?.projectName ?? "");
  const selectedClient = clients.find((client) => client.id === clientId);
  const [contactPerson, setContactPerson] = useState(editing?.contactPerson ?? selectedClient?.contact ?? "");
  const [trnNo, setTrnNo] = useState(editing?.trnNo ?? selectedClient?.trnNo ?? "");
  const [siteLocation, setSiteLocation] = useState(editing?.siteLocation ?? selectedClient?.address ?? "");
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    editing?.validUntil ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [prePrintedLetterhead, setPrePrintedLetterhead] = useState(editing?.prePrintedLetterhead ?? false);
  const [items, setItems] = useState<LineItem[]>(
    editing ? editing.items.map((i) => ({ ...i })) : [{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]
  );

  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((p) => p.map((r, x) => (x === i ? { ...r, ...patch } : r)));

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tax = subtotal * ((editing?.taxRate ?? settings.vatRate) / 100);
  const total = subtotal + tax;

  const selectClient = (id: string) => {
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    setContactPerson(client?.contact ?? "");
    setTrnNo(client?.trnNo ?? "");
    setSiteLocation(client?.address ?? "");
  };

  const save = () => {
    if (!clientId) return toast.error("Select client");
    onSubmit({
      date, validUntil, clientId, projectName, contactPerson, trnNo, siteLocation, notes, prePrintedLetterhead, items,
      taxRate: editing?.taxRate ?? settings.vatRate,
      status: editing?.status ?? "Draft",
    });
    if (editing) return;
    setOpen(false); setClientId(""); setProjectName(""); setContactPerson(""); setTrnNo(""); setSiteLocation(""); setNotes(""); setPrePrintedLetterhead(false);
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose?.(); }}>
      {!editing && (
        <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Quotation</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto rounded-xl border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b bg-modal-accent-soft px-6 py-5 pr-14 text-left">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-modal-accent text-modal-accent-foreground"><FileText className="h-5 w-5" /></div>
            <div><DialogTitle className="text-xl">{editing ? `Edit Quotation ${editing.no}` : "Create New Quotation"}</DialogTitle><DialogDescription className="mt-1">Fill in details to generate a quotation</DialogDescription></div>
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
              <div className="space-y-1.5 sm:col-span-2"><Label>Site Location</Label><Input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Quotation Number</Label><Input value={editing?.no ?? settings.nextQuotationNo} readOnly className="bg-muted font-mono" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Line Items</h3><Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}><Plus className="h-4 w-4" /> Add Item</Button></div>
            <div className="overflow-x-auto rounded-lg border"><div className="min-w-[720px]">
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
            </div></div>
          </section>

          <section className="grid gap-5 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Notes / Remarks</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add validity, delivery, or other remarks..." className="min-h-28 resize-none" /></div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Checkbox checked={prePrintedLetterhead} onCheckedChange={(value) => setPrePrintedLetterhead(value === true)} />Print on pre-printed company letterhead</label>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm"><div className="mb-3 font-semibold">Summary</div><div className="space-y-3"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{money(subtotal, settings.currency)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">VAT ({editing?.taxRate ?? settings.vatRate}%)</span><span className="tabular-nums">{money(tax, settings.currency)}</span></div><div className="h-px bg-border" /><div className="flex justify-between text-base font-bold text-modal-accent"><span>Grand Total</span><span className="tabular-nums">{money(total, settings.currency)}</span></div></div></div>
          </section>
        </div>
        <DialogFooter className="border-t bg-muted/40 px-6 py-4"><Button variant="secondary" onClick={() => { setOpen(false); onClose?.(); }}>Cancel</Button><Button className="bg-modal-accent text-modal-accent-foreground hover:bg-modal-accent/90" onClick={save}>{editing ? "Save Changes" : "Save Quotation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}