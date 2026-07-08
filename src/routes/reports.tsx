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
  const { invoices, expenses, settings } = useStore();

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
        <CardHeader><CardTitle className="text-base">Quarterly VAT Return</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">VAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-3 py-2">Sales / Output</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(totalRevenue - outputVat, settings.currency)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-success">{money(outputVat, settings.currency)}</td>
              </tr>
              <tr><td className="px-3 py-2">Purchases / Input</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(totalCost - inputVat, settings.currency)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-warning">{money(inputVat, settings.currency)}</td>
              </tr>
              <tr className="bg-primary/5 font-bold">
                <td className="px-3 py-2">Net VAT Payable to Authority</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right tabular-nums text-primary">{money(netVat, settings.currency)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}