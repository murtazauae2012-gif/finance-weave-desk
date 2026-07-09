import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [f, setF] = useState(settings);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Company profile, currency, VAT and invoice footer." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
              </div>
              <div className="text-sm text-muted-foreground">
                Logo upload placeholder<br />
                <span className="text-xs">Recommended 400×400 PNG</span>
              </div>
            </div>
            <div><Label>Company Name</Label><Input value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} /></div>
            <div><Label>Tagline</Label><Input value={f.companyTagline} onChange={(e) => setF({ ...f, companyTagline: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={f.companyAddress} onChange={(e) => setF({ ...f, companyAddress: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={f.companyPhone} onChange={(e) => setF({ ...f, companyPhone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={f.companyEmail} onChange={(e) => setF({ ...f, companyEmail: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Financial Defaults</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><Label>Default Currency</Label><Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
            <div><Label>Default Tax / VAT Rate (%)</Label><Input type="number" value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: +e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bank Payment Details</CardTitle></CardHeader>
          <CardContent>
            <Label>Shown in invoice footers</Label>
            <Textarea rows={3} value={f.bankDetails} onChange={(e) => setF({ ...f, bankDetails: e.target.value })} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => { updateSettings(f); toast.success("Settings saved"); }}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}