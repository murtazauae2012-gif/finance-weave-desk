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
import { useStore, money, quoteTotal, type LineItem, type QuoteStatus } from "@/lib/store";
import { Plus, Trash2, ArrowRightCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quotations")({ component: Quotations });

const statusColor: Record<QuoteStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/15 text-primary",
  Approved: "bg-success text-success-foreground",
  Rejected: "bg-destructive text-destructive-foreground",
};

function Quotations() {
  const { quotations, clients, products, settings, addQuotation, updateQuoteStatus, convertQuoteToInvoice } = useStore();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  const [items, setItems] = useState<LineItem[]>([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);

  const update = (i: number, patch: Partial<LineItem>) => setItems((p) => p.map((r, x) => x === i ? { ...r, ...patch } : r));

  const save = () => {
    if (!clientId) return toast.error("Select client");
    addQuotation({ date, validUntil, clientId, projectName, items, taxRate: settings.vatRate, status: "Draft" });
    toast.success("Quotation created");
    setOpen(false); setClientId(""); setProjectName("");
    setItems([{ description: "", qty: 1, unit: "Pcs", unitPrice: 0 }]);
  };

  return (
    <div>
      <PageHeader title="Quotations" description="Formal proposals with 1-click conversion to invoice.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Quotation</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
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
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <Select value={r.description} onValueChange={(v) => {
                    const p = products.find((x) => x.name === v);
                    update(i, { description: v, unit: p?.unit ?? r.unit, unitPrice: p?.price ?? r.unitPrice });
                  }}>
                    <SelectTrigger className="col-span-5"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="col-span-2" type="number" value={r.qty} onChange={(e) => update(i, { qty: +e.target.value })} />
                  <Input className="col-span-2" value={r.unit} onChange={(e) => update(i, { unit: e.target.value })} />
                  <Input className="col-span-2" type="number" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: +e.target.value })} />
                  <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <DialogFooter><Button onClick={save}>Save Quotation</Button></DialogFooter>
          </DialogContent>
        </Dialog>
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
                        {q.status === "Approved" && (
                          <Button size="sm" variant="outline" onClick={() => {
                            const inv = convertQuoteToInvoice(q.id);
                            if (inv) toast.success(`Created invoice ${inv.no}`);
                          }}>
                            <ArrowRightCircle className="h-4 w-4" /> To Invoice
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}