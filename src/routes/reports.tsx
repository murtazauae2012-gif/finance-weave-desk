import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useStore, money, invoiceTax, invoiceTotal, expenseTotal, type ExpenseCategory,
} from "@/lib/store";
import { Landmark, TrendingUp, TrendingDown, Scale } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/reports")({ component: Reports });

function Reports() {
  const { invoices, expenses, settings, clients } = useStore();

  const detectEmirate = (text: string): string => {
    const t = (text || "").toLowerCase();
    if (t.includes("abu dhabi")) return "Abu Dhabi";
    if (t.includes("dubai")) return "Dubai";
    if (t.includes("sharjah")) return "Sharjah";
    if (t.includes("ajman")) return "Ajman";
    if (t.includes("fujairah")) return "Fujairah";
    if (t.includes("ras al khaimah") || t.includes("rak")) return "Ras Al Khaimah";
    if (t.includes("umm al quwain") || t.includes("uaq")) return "Umm Al Quwain";
    return "Other";
  };
  const clientEmirate = (clientId: string) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? detectEmirate(c.address) : "Other";
  };
  const invoiceEmirate = (invoiceId: string) => {
    const iv = invoices.find((x) => x.id === invoiceId);
    return iv ? clientEmirate(iv.clientId) : "General / Overhead";
  };

  const outputVat = invoices.reduce((s, i) => s + invoiceTax(i), 0);
  const inputVat = expenses.reduce((s, e) => s + e.vat, 0);
  const netVat = outputVat - inputVat;
  const totalRevenue = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const totalCost = expenses.reduce((s, e) => s + expenseTotal(e), 0);

  // Monthly breakdown
  const byMonth = new Map<string, { month: string; revenue: number; expense: number }>();
  invoices.forEach((iv) => {
    const m = iv.date.slice(0, 7);
    const b = byMonth.get(m) ?? { month: m, revenue: 0, expense: 0 };
    b.revenue += invoiceTotal(iv); byMonth.set(m, b);
  });
  expenses.forEach((e) => {
    const m = e.date.slice(0, 7);
    const b = byMonth.get(m) ?? { month: m, revenue: 0, expense: 0 };
    b.expense += expenseTotal(e); byMonth.set(m, b);
  });
  const monthly = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));

  const pieColors = ["oklch(0.62 0.12 195)","oklch(0.7 0.15 75)","oklch(0.6 0.2 25)","oklch(0.5 0.1 260)"];
  const pie = (["Material","Petrol","Rent","Other"] as ExpenseCategory[]).map((c, i) => ({
    name: c,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + expenseTotal(e), 0),
    color: pieColors[i],
  }));

  return (
    <div>
      <PageHeader title="Reports" description="VAT summary, revenue trend, and expense analysis." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Output VAT (Collected)" value={money(outputVat, settings.currency)} icon={TrendingUp} tone="success" />
        <KpiCard label="Input VAT (Paid)" value={money(inputVat, settings.currency)} icon={TrendingDown} tone="warning" />
        <KpiCard label="Net VAT Payable" value={money(netVat, settings.currency)} icon={Landmark} tone={netVat >= 0 ? "primary" : "success"} />
        <KpiCard label="Gross P/L" value={money(totalRevenue - totalCost, settings.currency)} icon={Scale} tone="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue vs Expense (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => money(v, settings.currency)} />
                <Legend />
                <Bar dataKey="revenue" fill="oklch(0.62 0.12 195)" name="Revenue" radius={[4,4,0,0]} />
                <Bar dataKey="expense" fill="oklch(0.6 0.2 25)" name="Expense" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Expense Category Split</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v, settings.currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {pie.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded" style={{ background: p.color }} /> {p.name}</div>
                  <span className="tabular-nums font-medium">{money(p.value, settings.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Quarterly VAT Return (3-Month Filing Periods)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(() => {
            type Q = { key: string; label: string; range: string; sales: number; outVat: number; purchases: number; inVat: number };
            const qmap = new Map<string, Q>();
            const qKey = (d: string) => {
              const dt = new Date(d);
              const y = dt.getFullYear();
              const q = Math.floor(dt.getMonth() / 3) + 1;
              return { key: `${y}-Q${q}`, label: `Q${q} ${y}`, y, q };
            };
            const qRange = (y: number, q: number) => {
              const start = new Date(y, (q - 1) * 3, 1);
              const end = new Date(y, q * 3, 0);
              const f = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
              return `${f(start)} – ${f(end)} ${y}`;
            };
            const ensure = (d: string) => {
              const { key, label, y, q } = qKey(d);
              let row = qmap.get(key);
              if (!row) {
                row = { key, label, range: qRange(y, q), sales: 0, outVat: 0, purchases: 0, inVat: 0 };
                qmap.set(key, row);
              }
              return row;
            };
            invoices.forEach((iv) => {
              const r = ensure(iv.date);
              r.sales += invoiceTotal(iv) - invoiceTax(iv);
              r.outVat += invoiceTax(iv);
            });
            expenses.forEach((e) => {
              const r = ensure(e.date);
              r.purchases += e.amount;
              r.inVat += e.vat;
            });
            const quarters = Array.from(qmap.values()).sort((a, b) => a.key.localeCompare(b.key));
            if (quarters.length === 0) return <p className="text-sm text-muted-foreground">No data available.</p>;
            return quarters.map((r) => {
              const net = r.outVat - r.inVat;
              return (
                <div key={r.key} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                    <div>
                      <div className="font-semibold text-sm">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.range}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Net VAT {net >= 0 ? "Payable" : "Refundable"}</div>
                      <div className={`font-bold tabular-nums ${net >= 0 ? "text-primary" : "text-success"}`}>
                        {money(Math.abs(net), settings.currency)}
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-right">VAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-3 py-2">Sales / Output</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(r.sales, settings.currency)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-success">{money(r.outVat, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Purchases / Input</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(r.purchases, settings.currency)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-warning">{money(r.inVat, settings.currency)}</td>
                      </tr>
                      <tr className="bg-primary/5 font-bold">
                        <td className="px-3 py-2">Net VAT {net >= 0 ? "Payable" : "Refundable"}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right tabular-nums text-primary">{money(net, settings.currency)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            });
          })()}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Emirate-wise VAT Breakdown (Sales & Purchases)</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            type Row = { emirate: string; sales: number; outVat: number; purchases: number; inVat: number };
            const map = new Map<string, Row>();
            const ensure = (em: string) => {
              let r = map.get(em);
              if (!r) { r = { emirate: em, sales: 0, outVat: 0, purchases: 0, inVat: 0 }; map.set(em, r); }
              return r;
            };
            invoices.forEach((iv) => {
              const r = ensure(clientEmirate(iv.clientId));
              r.sales += invoiceTotal(iv) - invoiceTax(iv);
              r.outVat += invoiceTax(iv);
            });
            expenses.forEach((e) => {
              const em = e.projectId === "GENERAL" ? "General / Overhead" : invoiceEmirate(e.projectId);
              const r = ensure(em);
              r.purchases += e.amount;
              r.inVat += e.vat;
            });
            const rows = Array.from(map.values()).sort((a, b) => a.emirate.localeCompare(b.emirate));
            const totals = rows.reduce((t, r) => ({
              sales: t.sales + r.sales, outVat: t.outVat + r.outVat,
              purchases: t.purchases + r.purchases, inVat: t.inVat + r.inVat,
            }), { sales: 0, outVat: 0, purchases: 0, inVat: 0 });
            return (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Emirate</th>
                      <th className="px-3 py-2 text-right">Sales (Excl. VAT)</th>
                      <th className="px-3 py-2 text-right">Output VAT</th>
                      <th className="px-3 py-2 text-right">Purchases (Excl. VAT)</th>
                      <th className="px-3 py-2 text-right">Input VAT</th>
                      <th className="px-3 py-2 text-right">Net VAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => {
                      const net = r.outVat - r.inVat;
                      return (
                        <tr key={r.emirate}>
                          <td className="px-3 py-2 font-medium">{r.emirate}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{money(r.sales, settings.currency)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-success">{money(r.outVat, settings.currency)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{money(r.purchases, settings.currency)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-warning">{money(r.inVat, settings.currency)}</td>
                          <td className={`px-3 py-2 text-right tabular-nums font-semibold ${net >= 0 ? "text-primary" : "text-success"}`}>{money(net, settings.currency)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-primary/5 font-bold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(totals.sales, settings.currency)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-success">{money(totals.outVat, settings.currency)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(totals.purchases, settings.currency)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-warning">{money(totals.inVat, settings.currency)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-primary">{money(totals.outVat - totals.inVat, settings.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}