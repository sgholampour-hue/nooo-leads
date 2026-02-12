import { LeadWithStats } from "@/types/leads";

export function exportToCSV(leads: LeadWithStats[]) {
  const headers = [
    "Bedrijfsnaam", "Website", "KvK Number", "Locatie",
    "Lease Expiratie", "Verhuizing", "Email", "LinkedIn",
    "Urgentie Score", "Aantal Notities"
  ];
  const rows = leads.map(lead => [
    lead.bedrijfsnaam, lead.website, lead.kvk_number,
    lead.office_address, lead.expiration_year, lead.relocation_start,
    lead.cfo_email || "", lead.linkedin_page, lead.urgency_score, lead.note_count
  ]);
  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nooo_leads_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
