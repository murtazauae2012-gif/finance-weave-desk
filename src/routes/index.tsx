import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet, Banknote, AlertCircle, Receipt, Landmark, FilePlus2, ReceiptText,
} from "lucide-react";
import { KpiCard, PageHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useStore, money, invoiceTotal, invoicePaid, invoiceOutstanding,
  invoiceTax, expenseTotal,
} from "@/lib/store";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { invoices, expenses, settings, clients } = useStore();
  const totalInvoiced = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const totalReceived = invoices.reduce((s, i) => s + invoicePaid(i), 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceOutstanding(i), 0);
  const totalExpenses = expenses.reduce((s, e) => s + expenseTotal(e), 0);
  const outputVat = invoices.reduce((s, i) => s + invoiceTax(i), 0);
  const inputVat = expenses.reduce((s, e) => s + e.vat, 0);
  const netVat = outputVat - inputVat;

  const recent = [...invoices].slice(-5).reverse();

  return (
    <div>
      <PageHeader title="Dashboard" description="Financial snapshot of every active project.">
        <Button asChild variant="outline"><Link to="/expenses"><ReceiptText className="h-4 w-4" /> Log Expense</Link></Button>
        <Button asChild><Link to="/invoices"><FilePlus2 className="h-4 w-4" /> Create Invoice</Link></Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total Invoiced" value={money(totalInvoiced, settings.currency)} icon={Wallet} tone="primary" />
        <KpiCard label="Total Received" value={money(totalReceived, settings.currency)} icon={Banknote} tone="success" />
        <KpiCard label="Outstanding Balance" value={money(outstanding, settings.currency)} icon={AlertCircle} tone="warning" />
        <KpiCard label="Total Expenses" value={money(totalExpenses, settings.currency)} icon={Receipt} tone="destructive" />
        <KpiCard label="Net VAT Payable" value={money(netVat, settings.currency)} icon={Landmark} tone="default"
          sub={`Output ${money(outputVat, settings.currency)} − Input ${money(inputVat, settings.currency)}`} />
      </div>

      <div className="grid gap-6 mt-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recent.map((iv) => {
                const c = clients.find((x) => x.id === iv.clientId);
                const out = invoiceOutstanding(iv);
                return (
                  <div key={iv.id} className="py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{iv.no} · {iv.projectName}</div>
                      <div className="text-xs text-muted-foreground truncate">{c?.name} · {iv.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{money(invoiceTotal(iv), settings.currency)}</div>
                      <div className={`text-xs tabular-nums ${out > 0 ? "text-warning" : "text-success"}`}>
                        {out > 0 ? `Due ${money(out, settings.currency)}` : "Fully paid"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Expense Split</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(["Material","Petrol","Rent","Other"] as const).map((cat) => {
              const sum = expenses.filter((e) => e.category === cat).reduce((s, e) => s + expenseTotal(e), 0);
              const pct = totalExpenses ? (sum / totalExpenses) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{cat}</span>
                    <span className="tabular-nums text-muted-foreground">{money(sum, settings.currency)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
