import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function NewLead() {
  const navigate = useNavigate();
  const { addLead } = useLeadsContext();
  const [form, setForm] = useState({
    kvk_number: "",
    bedrijfsnaam: "",
    website: "",
    office_address: "",
    relocation_start: "",
    expiration_year: "",
    lease_duration: "",
    linkedin_page: "",
    cfo_email: "",
    snippet: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bedrijfsnaam || !form.kvk_number) {
      toast.error("Bedrijfsnaam en KvK nummer zijn verplicht");
      return;
    }
    addLead({ ...form, kvk_number: parseInt(form.kvk_number, 10) } as any);
    toast.success("Lead aangemaakt!");
    navigate("/leads");
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Nieuwe Lead</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
                <Input id="bedrijfsnaam" value={form.bedrijfsnaam} onChange={e => update("bedrijfsnaam", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kvk">KvK Nummer *</Label>
                <Input id="kvk" type="number" value={form.kvk_number} onChange={e => update("kvk_number", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={e => update("website", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">CFO Email</Label>
                <Input id="email" type="email" value={form.cfo_email} onChange={e => update("cfo_email", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Kantooradres</Label>
                <Input id="address" value={form.office_address} onChange={e => update("office_address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiratie Jaar</Label>
                <Input id="expiration" value={form.expiration_year} onChange={e => update("expiration_year", e.target.value)} placeholder="bijv. 2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Lease Duur</Label>
                <Input id="duration" value={form.lease_duration} onChange={e => update("lease_duration", e.target.value)} placeholder="bijv. 5 jaar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relocation">Verhuizing Start</Label>
                <Input id="relocation" value={form.relocation_start} onChange={e => update("relocation_start", e.target.value)} placeholder="bijv. Q1 2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={form.linkedin_page} onChange={e => update("linkedin_page", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="snippet">Bedrijfsomschrijving</Label>
              <Textarea id="snippet" value={form.snippet} onChange={e => update("snippet", e.target.value)} rows={4} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => navigate(-1)}>Annuleer</Button>
              <Button type="submit"><Save className="mr-2 h-4 w-4" /> Opslaan</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
