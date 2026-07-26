import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore, money, quoteTotal, type LineItem, type QuoteStatus, type Quotation } from "@/lib/store";
import { Plus, Trash2, ArrowRightCircle, Eye, Pencil } from "lucide-react";
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

      <DocumentDialog open={!!viewQ} onClose={() => setViewQ(null)}>
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
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    editing?.validUntil ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<LineItem[]>(
    editing ? editing.items.map((i) => ({ ...i })) : [{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]
  );

  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((p) => p.map((r, x) => (x === i ? { ...r, ...patch } : r)));

  const save = () => {
    if (!clientId) return toast.error("Select client");
    onSubmit({
      date, validUntil, clientId, projectName, items,
      taxRate: editing?.taxRate ?? settings.vatRate,
      status: editing?.status ?? "Draft",
    });
    if (editing) return;
    setOpen(false); setClientId(""); setProjectName("");
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose?.(); }}>
      {!editing && (
        <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Quotation</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? `Edit Quotation ${editing.no}` : "Create Quotation"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          <div>
            <Label>Customer</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Project Name</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Label>Items</Label>
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}><Plus className="h-3 w-3" /> Row</Button>
          </div>
          {items.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-start">
              <div className="col-span-5 flex flex-col gap-1">
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
              <Input className="col-span-2" type="number" value={r.qty} onChange={(e) => update(i, { qty: +e.target.value })} />
              <Input className="col-span-2" value={r.unit} onChange={(e) => update(i, { unit: e.target.value })} />
              <Input className="col-span-2" type="number" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: +e.target.value })} />
              <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <DialogFooter><Button onClick={save}>{editing ? "Save Changes" : "Save Quotation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}