import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, money } from "@/lib/store";
import { Plus, Package2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({ component: Products });

function Products() {
  const { products, settings, addProduct } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "Pcs", price: 0, description: "" });
  return (
    <div>
      <PageHeader title="Services & Items Register" description="Master catalog of services and fabrication profiles (no stock).">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Service / Item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Pcs","Sft","Job","Lot","Meter","Hour"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Base Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!form.name) return toast.error("Name required");
                addProduct(form); toast.success("Added"); setOpen(false);
                setForm({ name: "", unit: "Pcs", price: 0, description: "" });
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Package2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
              </div>
              <h3 className="font-semibold mt-3">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Base Price</div>
                  <div className="font-bold text-primary tabular-nums">{money(p.price, settings.currency)}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-muted font-medium">per {p.unit}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}