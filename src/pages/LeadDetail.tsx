import { useParams, useNavigate } from "react-router-dom";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { useNotes } from "@/hooks/useNotes";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, ExternalLink, Edit, Save, Plus, Pin, Trash2,
  MoreVertical, MessageSquare, Clock, User, Globe, MapPin,
  Calendar, Mail, Linkedin, X
} from "lucide-react";
import { useState } from "react";
import { StatusTimeline } from "@/components/StatusTimeline";
import { toast } from "sonner";

const noteTypeLabels: Record<string, string> = {
  general: "Algemeen",
  contact_attempt: "Contact",
  meeting: "Meeting",
  follow_up: "Follow-up",
  proposal: "Voorstel",
};

function getScoreColor(score: number) {
  if (score >= 90) return "text-destructive";
  if (score >= 70) return "text-warning";
  if (score >= 50) return "text-foreground";
  return "text-muted-foreground";
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allLeads, notes: allNotes, setNotes: setAllNotes, statusHistory, updateLead } = useLeadsContext();
  const lead = allLeads.find(l => l.id === id);

  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes(allNotes, setAllNotes, id || "");

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [showFullSnippet, setShowFullSnippet] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bedrijfsnaam: "",
    website: "",
    office_address: "",
    expiration_year: "",
    lease_duration: "",
    relocation_start: "",
    cfo_email: "",
    linkedin_page: "",
    snippet: "",
  });

  if (!lead) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">Lead niet gevonden</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar leads
          </Button>
        </div>
      </AppLayout>
    );
  }

  const startEditing = () => {
    setEditForm({
      bedrijfsnaam: lead.bedrijfsnaam,
      website: lead.website,
      office_address: lead.office_address,
      expiration_year: lead.expiration_year,
      lease_duration: lead.lease_duration,
      relocation_start: lead.relocation_start,
      cfo_email: lead.cfo_email,
      linkedin_page: lead.linkedin_page,
      snippet: lead.snippet,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateLead(lead.id, editForm);
    setIsEditing(false);
    toast.success("Lead bijgewerkt");
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim()) return;
    addNote(newNoteText, newNoteType);
    setNewNoteText("");
    setNewNoteType("general");
    setShowNoteForm(false);
    toast.success("Notitie toegevoegd");
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editNoteText.trim()) return;
    updateNote(noteId, editNoteText);
    setEditingNoteId(null);
    setEditNoteText("");
    toast.success("Notitie bijgewerkt");
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) {
      deleteNote(noteId);
      toast.success("Notitie verwijderd");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m geleden`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}u geleden`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d geleden`;
    return new Date(dateStr).toLocaleDateString("nl-NL");
  };

  const updateField = (field: string, value: string) => setEditForm(prev => ({ ...prev, [field]: value }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/leads")}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight truncate">
              {lead.bedrijfsnaam}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">KvK: {lead.kvk_number}</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className={`text-lg font-display font-bold tabular-nums ${getScoreColor(lead.urgency_score)}`}>
              {lead.urgency_score > 0 ? lead.urgency_score : "—"}
            </span>
            {!isEditing && (
              <Button variant="outline" size="sm" className="text-xs" onClick={startEditing}>
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Lease Expiry</p>
            <p className="text-lg font-display font-bold text-foreground">{lead.expiration_year}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Duration</p>
            <p className="text-lg font-display font-bold text-foreground">{lead.lease_duration}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Relocation</p>
            <p className="text-lg font-display font-bold text-foreground">{lead.relocation_start}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
            <p className="text-lg font-display font-bold text-foreground">{notes.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Lead Info */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 sm:p-6">
            {isEditing ? (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-display font-bold text-foreground tracking-tight">Edit Lead</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsEditing(false)}>
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" className="text-xs" onClick={handleSaveEdit}>
                      <Save className="mr-1 h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bedrijfsnaam</Label>
                    <Input value={editForm.bedrijfsnaam} onChange={e => updateField("bedrijfsnaam", e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <Input value={editForm.website} onChange={e => updateField("website", e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Kantooradres</Label>
                    <Input value={editForm.office_address} onChange={e => updateField("office_address", e.target.value)} className="text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Expiratie Jaar</Label>
                      <Input value={editForm.expiration_year} onChange={e => updateField("expiration_year", e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Lease Duur</Label>
                      <Input value={editForm.lease_duration} onChange={e => updateField("lease_duration", e.target.value)} className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Verhuizing Start</Label>
                    <Input value={editForm.relocation_start} onChange={e => updateField("relocation_start", e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input value={editForm.cfo_email} onChange={e => updateField("cfo_email", e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">LinkedIn</Label>
                    <Input value={editForm.linkedin_page} onChange={e => updateField("linkedin_page", e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bedrijfsomschrijving</Label>
                    <Textarea value={editForm.snippet} onChange={e => updateField("snippet", e.target.value)} rows={4} className="text-sm" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display font-bold text-foreground tracking-tight mb-5">Details</h3>
                <div className="space-y-4">
                  <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={lead.website} isLink />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Locatie" value={lead.office_address} />
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lead.cfo_email} isEmail />
                  <InfoRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={lead.linkedin_page} isLink />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Gevonden op" value={new Date(lead.gevonden_op).toLocaleDateString("nl-NL")} />
                </div>

                {lead.snippet && (
                  <div className="mt-5 pt-5 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Omschrijving</h4>
                    <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullSnippet ? "line-clamp-4" : ""}`}>
                      {lead.snippet}
                    </p>
                    {lead.snippet.length > 150 && (
                      <button
                        className="text-xs text-foreground font-medium mt-1.5 hover:underline"
                        onClick={() => setShowFullSnippet(!showFullSnippet)}
                      >
                        {showFullSnippet ? "Less" : "More"}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-5 pt-5 border-t border-border">
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {lead.linkedin_page && (
                    <a
                      href={lead.linkedin_page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Notes */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 sm:p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-foreground tracking-tight">
                Notes <span className="text-muted-foreground font-normal text-sm">({notes.length})</span>
              </h3>
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowNoteForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Note
              </Button>
            </div>

            {showNoteForm && (
              <div className="p-4 mb-4 bg-muted/50 border border-border rounded-lg">
                <Textarea
                  placeholder="Write your note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  rows={3}
                  className="mb-3 text-sm bg-card"
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <Select value={newNoteType} onValueChange={setNewNoteType}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Algemeen</SelectItem>
                      <SelectItem value="contact_attempt">Contact</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="proposal">Voorstel</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowNoteForm(false)}>Cancel</Button>
                    <Button size="sm" className="text-xs" onClick={handleSaveNote}>
                      <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {notes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No notes yet</p>
                </div>
              )}
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    note.is_pinned ? "border-foreground/20 bg-muted/30" : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {noteTypeLabels[note.note_type] || "Algemeen"}
                      </span>
                      {note.is_pinned && <Pin className="h-3 w-3 text-foreground" />}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
                          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(note.id)}>
                          <Pin className="mr-2 h-4 w-4" />
                          {note.is_pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.note_text); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <Textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={3} className="text-sm" />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                        <Button size="sm" className="text-xs" onClick={() => handleUpdateNote(note.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3 leading-relaxed">{note.note_text}</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(note.created_at)}</span>
                    {note.created_by && <span className="flex items-center gap-1"><User className="h-3 w-3" />{note.created_by}</span>}
                    {note.created_at !== note.updated_at && <span className="italic">(edited)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <StatusTimeline history={statusHistory.filter(s => s.lead_id === id)} />
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon, label, value, isLink, isEmail }: { icon: React.ReactNode; label: string; value: string; isLink?: boolean; isEmail?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline truncate block">{value}</a>
        ) : isEmail ? (
          <a href={`mailto:${value}`} className="text-sm text-foreground hover:underline">{value}</a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
