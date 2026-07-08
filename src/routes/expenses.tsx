import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, money, expenseTotal, type ExpenseCategory } from "@/lib/store";
import { Plus, HardHat, Fuel, Building2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/expenses")({ component: Expenses });

const catMeta: Record<ExpenseCategory, { icon: any; tone: any }> = {
  Material: { icon: HardHat, tone: "primary" },
  Petrol:   { icon: Fuel, tone: "warning" },
  Rent:     { icon: Building2, tone: "destructive" },
  Other:    { icon: MoreHorizontal, tone: "default" },
};

function Expenses() {
  const { expenses, invoices, settings, addExpense } = useStore();
  const [tab, setTab] = useState<"All" | ExpenseCategory>("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    projectId: "GENERAL" as string,
    vendor: "",
    category: "Material" as ExpenseCategory,
    refNo: "",
    amount: 0,
    vat: 0,
  });

  const totals = (["Material","Petrol","Rent","Other"] as ExpenseCategory[]).reduce((acc, c) => {
    acc[c] = expenses.filter((e) => e.category === c).reduce((s, e) => s + expenseTotal(e), 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const filtered = tab === "All" ? expenses : expenses.filter((e) => e.category === tab);

  return (
    <div>
      <PageHeader title="Expenses" description="Segregated project & overhead spend across 4 categories.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Log Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Expense Entry</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Material","Petrol","Rent","Other"] as ExpenseCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{c} Expense</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Linked Project</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General / Overhead</SelectItem>
                    {invoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.projectName} ({i.no})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div><Label>Invoice / Receipt Ref</Label><Input value={form.refNo} onChange={(e) => setForm({ ...form, refNo: e.target.value })} /></div>
              <div><Label>Amount (excl. VAT)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value, vat: +(e.target.value) * settings.vatRate / 100 })} /></div>
              <div><Label>VAT Paid ({settings.vatRate}%)</Label><Input type="number" value={form.vat} onChange={(e) => setForm({ ...form, vat: +e.target.value })} /></div>
              <div className="col-span-2 p-3 rounded-md bg-muted text-sm flex justify-between">
                <span className="text-muted-foreground">Total Expense</span>
                <span className="font-bold tabular-nums">{money(form.amount + form.vat, settings.currency)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!form.vendor || !form.amount) return toast.error("Vendor & amount required");
                addExpense(form); toast.success("Expense logged"); setOpen(false);
                setForm({ ...form, vendor: "", refNo: "", amount: 0, vat: 0 });
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {(["Material","Petrol","Rent","Other"] as ExpenseCategory[]).map((c) => (
          <KpiCard key={c} label={`${c} Expense`} value={money(totals[c], settings.currency)} icon={catMeta[c].icon} tone={catMeta[c].tone} />
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="All">All</TabsTrigger>
          {(["Material","Petrol","Rent","Other"] as ExpenseCategory[]).map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Ref</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((e) => {
                      const proj = invoices.find((i) => i.id === e.projectId);
                      return (
                        <tr key={e.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs">{e.id}</td>
                          <td className="px-4 py-3">{e.date}</td>
                          <td className="px-4 py-3">{proj?.projectName ?? "General / Overhead"}</td>
                          <td className="px-4 py-3">{e.vendor}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">{e.category}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{e.refNo}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{money(e.amount, settings.currency)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{money(e.vat, settings.currency)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{money(expenseTotal(e), settings.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}