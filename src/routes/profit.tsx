import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  useStore, money, invoiceTotal, invoicePaid, expenseTotal,
} from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/profit")({ component: Profit });

function Profit() {
  const { invoices, expenses, clients, settings } = useStore();

  // group by clientId+projectName
  const projects = Array.from(
    invoices.reduce((map, iv) => {
      const key = `${iv.clientId}::${iv.projectName}`;
      const bucket = map.get(key) ?? {
        clientId: iv.clientId, projectName: iv.projectName,
        lpoValue: 0, billed: 0, received: 0, invoiceIds: [] as string[],
      };
      bucket.lpoValue += iv.lpoValue;
      bucket.billed += invoiceTotal(iv);
      bucket.received += invoicePaid(iv);
      bucket.invoiceIds.push(iv.id);
      map.set(key, bucket);
      return map;
    }, new Map<string, { clientId: string; projectName: string; lpoValue: number; billed: number; received: number; invoiceIds: string[] }>()).values()
  );

  const rows = projects.map((p) => {
    const exp = expenses
      .filter((e) => p.invoiceIds.includes(e.projectId))
      .reduce((s, e) => s + expenseTotal(e), 0);
    const profit = p.billed - exp;
    const margin = p.billed ? (profit / p.billed) * 100 : 0;
    const client = clients.find((c) => c.id === p.clientId);
    return { ...p, clientName: client?.name ?? "", exp, profit, margin };
  });

  return (
    <div>
      <PageHeader title="Project Profitability" description="Live P&L by contract – Billed vs. Expenses." />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Project / Client</th>
                  <th className="px-4 py-3 font-semibold text-right">LPO Value</th>
                  <th className="px-4 py-3 font-semibold text-right">Billed</th>
                  <th className="px-4 py-3 font-semibold text-right">Received</th>
                  <th className="px-4 py-3 font-semibold text-right">Expenses</th>
                  <th className="px-4 py-3 font-semibold text-right">Net P/L</th>
                  <th className="px-4 py-3 font-semibold text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.projectName}</div>
                      <div className="text-xs text-muted-foreground">{r.clientName}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(r.lpoValue, settings.currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(r.billed, settings.currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(r.received, settings.currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-destructive">{money(r.exp, settings.currency)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {money(r.profit, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={r.margin >= 0 ? "default" : "destructive"} className={r.margin >= 30 ? "bg-success text-success-foreground" : ""}>
                        {r.margin.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}