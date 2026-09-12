import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ImagePlus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const MAX_IMAGE_MB = 5;

/** Reads an image file into a data URL so it can be stored with the settings. */
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file (PNG or JPG)."));
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return reject(new Error(`Image must be smaller than ${MAX_IMAGE_MB} MB.`));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function ImageUploader({
  id, value, onChange, emptyLabel, hint, previewClassName, aspect,
}: {
  id: string;
  value: string;
  onChange: (dataUrl: string) => void;
  emptyLabel: string;
  hint: string;
  previewClassName: string;
  aspect: "square" | "page";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onChange(await readImageFile(file));
      toast.success("Image loaded — click Save Changes to keep it");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${previewClassName} shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground flex items-center justify-center`}
        aria-label={value ? `Change ${emptyLabel.toLowerCase()}` : `Upload ${emptyLabel.toLowerCase()}`}
      >
        {value ? (
          <img src={value} alt={emptyLabel} className={aspect === "square" ? "h-full w-full object-contain" : "h-full w-full object-contain object-top"} />
        ) : (
          <ImagePlus className="h-6 w-6" />
        )}
      </button>
      <div className="space-y-2 text-sm">
        <div className="text-muted-foreground">
          {value ? `${emptyLabel} uploaded` : `No ${emptyLabel.toLowerCase()} uploaded`}<br />
          <span className="text-xs">{hint}</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
        <input id={id} ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFile} />
      </div>
    </div>
  );
}

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
            <ImageUploader
              id="company-logo"
              value={f.logo}
              onChange={(logo) => setF({ ...f, logo })}
              emptyLabel="Company logo"
              hint="Recommended 400×400 PNG. Shown at the top of printed documents."
              previewClassName="h-20 w-20"
              aspect="square"
            />
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
          <CardHeader><CardTitle className="text-base">Custom Letterhead</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Upload a full-page A4 image of your company letterhead. When a quotation or invoice is printed with the
              "pre-printed company letterhead" option on, the document is laid over this image and the digital header is hidden.
              You can still adjust the top margin in the print preview.
            </p>
            <ImageUploader
              id="company-letterhead"
              value={f.letterhead}
              onChange={(letterhead) => setF({ ...f, letterhead })}
              emptyLabel="Letterhead"
              hint="Recommended A4 portrait (2480×3508 px) PNG or JPG."
              previewClassName="h-40 w-28"
              aspect="page"
            />
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
          <CardHeader><CardTitle className="text-base">Document Numbering</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Set the next number to be used. The trailing digits increase automatically each time a document is created
              (e.g. QTN-0330 → QTN-0331, INV-0001 → INV-0002).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starting / Next Quotation Number</Label>
                <Input value={f.nextQuotationNo} onChange={(e) => setF({ ...f, nextQuotationNo: e.target.value })} placeholder="QTN-0330" />
              </div>
              <div>
                <Label>Starting / Next Invoice Number</Label>
                <Input value={f.nextInvoiceNo} onChange={(e) => setF({ ...f, nextInvoiceNo: e.target.value })} placeholder="INV-0001" />
              </div>
            </div>
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
