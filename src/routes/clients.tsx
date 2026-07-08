import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  useStore, money, invoiceTotal, invoicePaid, invoiceOutstanding,
} from "@/lib/store";
import { Plus, Building2, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({ component: Clients });

function Clients() {
  const { clients, invoices, settings, addClient } = useStore();
  const [selected, setSelected] = useState(clients[0]?.id ?? "");
  const client = clients.find((c) => c.id === selected);
  const clientInvoices = invoices.filter((i) => i.clientId === selected);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "" });

  return (
    <div>
      <PageHeader title="Clients" description="CRM directory of customers, projects and history.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Contact Person</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Site Location</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!form.name) return toast.error("Name required");
                addClient(form);
                toast.success("Client added");
                setOpen(false);
                setForm({ name: "", contact: "", phone: "", email: "", address: "" });
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {clients.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-full text-left p-4 transition-colors ${selected === c.id ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Building2 className="h-4 w-4 text-primary" /> {c.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{c.id} · {c.contact}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {client && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
                <div className="text-sm text-muted-foreground">{client.contact}</div>
                <div className="grid gap-2 mt-4 sm:grid-cols-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {client.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {client.email}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {client.address}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b text-sm font-semibold">Projects & Invoice History</div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice</th>
                      <th className="px-4 py-2 text-left">Project</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-right">Paid</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clientInvoices.map((iv) => (
                      <tr key={iv.id}>
                        <td className="px-4 py-2 font-mono text-xs">{iv.no}</td>
                        <td className="px-4 py-2">{iv.projectName}</td>
                        <td className="px-4 py-2">{iv.date}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{money(invoiceTotal(iv), settings.currency)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-success">{money(invoicePaid(iv), settings.currency)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-warning">{money(invoiceOutstanding(iv), settings.currency)}</td>
                      </tr>
                    ))}
                    {clientInvoices.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground text-sm">No invoices yet</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}