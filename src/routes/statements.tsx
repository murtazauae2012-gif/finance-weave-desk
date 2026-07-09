import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, money, invoiceTotal } from "@/lib/store";
import { DocumentDialog, PrintStatement } from "@/components/print-docs";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/statements")({ component: Statements });

function Statements() {
  const { clients, invoices, settings } = useStore();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [printOpen, setPrintOpen] = useState(false);
  const client = clients.find((c) => c.id === clientId);

  const clientInvs = invoices.filter((i) => i.clientId === clientId).sort((a, b) => a.date.localeCompare(b.date));

  interface Row {
    date: string; project: string; invoiceRef: string; lpoNo: string;
    lpoAmount: number; billed: number; paid: number; balance: number;
  }
  const rows: Row[] = [];
  let bal = 0;
  clientInvs.forEach((iv) => {
    const t = invoiceTotal(iv);
    bal += t;
    rows.push({
      date: iv.date, project: iv.projectName, invoiceRef: iv.no,
      lpoNo: iv.lpoNo, lpoAmount: iv.lpoValue, billed: t, paid: 0, balance: bal,
    });
    iv.payments.forEach((p) => {
      bal -= p.amount;
      rows.push({
        date: p.date, project: iv.projectName, invoiceRef: `${iv.no} · ${p.voucherNo}`,
        lpoNo: iv.lpoNo, lpoAmount: 0, billed: 0, paid: p.amount, balance: bal,
      });
    });
  });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  // recompute running balance after sort
  let running = 0;
  rows.forEach((r) => { running += r.billed - r.paid; r.balance = running; });

  const totalBilled = rows.reduce((s, r) => s + r.billed, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);

  return (
    <div>
      <PageHeader title="Statement of Account" description="Real-time customer running ledger.">
        <div className="flex gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setPrintOpen(true)} disabled={!client}>
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </PageHeader>

      {client && (
        <>
          <Card className="mb-4">
            <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Customer</div>
                <div className="text-lg font-bold">{client.name}</div>
                <div className="text-xs text-muted-foreground">{client.address}</div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total Billed</div>
                  <div className="font-bold text-primary tabular-nums">{money(totalBilled, settings.currency)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total Received</div>
                  <div className="font-bold text-success tabular-nums">{money(totalPaid, settings.currency)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Balance Due</div>
                  <div className="font-bold text-warning tabular-nums">{money(totalBilled - totalPaid, settings.currency)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 text-left">Doc Date</th>
                      <th className="px-3 py-3 text-left">Project</th>
                      <th className="px-3 py-3 text-left">Invoice Ref</th>
                      <th className="px-3 py-3 text-left">LPO No</th>
                      <th className="px-3 py-3 text-right">LPO Value</th>
                      <th className="px-3 py-3 text-right">Invoice Billed</th>
                      <th className="px-3 py-3 text-right">Partial Paid</th>
                      <th className="px-3 py-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">{r.project}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.invoiceRef}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.lpoNo || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.lpoAmount ? money(r.lpoAmount, settings.currency) : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.billed ? money(r.billed, settings.currency) : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-success">{r.paid ? money(r.paid, settings.currency) : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{money(r.balance, settings.currency)}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={8} className="text-center p-10 text-muted-foreground">No transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <DocumentDialog open={printOpen} onClose={() => setPrintOpen(false)}>
        {client && <PrintStatement client={client} />}
      </DocumentDialog>
    </div>
  );
}