import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(20),
});

export interface ScannedBill {
  vendor: string;
  refNo: string;
  date: string;
  amount: number;
  vat: number;
  trnNo: string;
  emirate: string;
  category: "Material" | "Petrol" | "Rent" | "Other";
}

export const scanBill = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<ScannedBill> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured (missing API key).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract expense data from UAE supplier bills/receipts. Reply ONLY with compact JSON, no markdown.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Extract from this bill and return JSON with exactly these keys: {"vendor":string,"refNo":string,"date":"YYYY-MM-DD","amount":number (net amount excluding VAT),"vat":number (VAT amount),"trnNo":string (supplier TRN, 15-16 digits, keep as printed),"emirate":one of "Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah" or "","category":one of "Material","Petrol","Rent","Other"}. Use "" or 0 when unknown.',
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please top up in Lovable.");
      throw new Error(`Bill scan failed (${res.status}): ${msg.slice(0, 200)}`);
    }

    const json: any = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const cats = ["Material", "Petrol", "Rent", "Other"];
    return {
      vendor: String(parsed.vendor ?? ""),
      refNo: String(parsed.refNo ?? ""),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date ?? "")) ? String(parsed.date) : "",
      amount: Number(parsed.amount) || 0,
      vat: Number(parsed.vat) || 0,
      trnNo: String(parsed.trnNo ?? ""),
      emirate: String(parsed.emirate ?? ""),
      category: cats.includes(parsed.category) ? parsed.category : "Other",
    };
  });
