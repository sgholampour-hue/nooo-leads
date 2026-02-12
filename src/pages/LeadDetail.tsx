import { useParams, useNavigate } from "react-router-dom";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { useNotes } from "@/hooks/useNotes";
import { AppLayout } from "@/components/AppLayout";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

const noteTypeColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  contact_attempt: "bg-primary/10 text-primary",
  meeting: "bg-success/10 text-success",
  follow_up: "bg-warning/10 text-warning",
  proposal: "bg-destructive/10 text-destructive",
};

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
          <p className="text-muted-foreground">Lead niet gevonden</p>
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
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{lead.bedrijfsnaam}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">KvK: {lead.kvk_number}</p>
          </div>
          <div className="shrink-0">
            <UrgencyBadge score={lead.urgency_score} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Lead Info */}
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Lead Informatie</h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="mr-2 h-3.5 w-3.5" /> Bewerk
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="mr-1 h-3.5 w-3.5" /> Annuleer
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="mr-1 h-3.5 w-3.5" /> Opslaan
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bedrijfsnaam</Label>
                  <Input value={editForm.bedrijfsnaam} onChange={e => updateField("bedrijfsnaam", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Website</Label>
                  <Input value={editForm.website} onChange={e => updateField("website", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kantooradres</Label>
                  <Input value={editForm.office_address} onChange={e => updateField("office_address", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiratie Jaar</Label>
                    <Input value={editForm.expiration_year} onChange={e => updateField("expiration_year", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lease Duur</Label>
                    <Input value={editForm.lease_duration} onChange={e => updateField("lease_duration", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Verhuizing Start</Label>
                  <Input value={editForm.relocation_start} onChange={e => updateField("relocation_start", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input value={editForm.cfo_email} onChange={e => updateField("cfo_email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">LinkedIn</Label>
                  <Input value={editForm.linkedin_page} onChange={e => updateField("linkedin_page", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bedrijfsomschrijving</Label>
                  <Textarea value={editForm.snippet} onChange={e => updateField("snippet", e.target.value)} rows={4} />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={lead.website} isLink />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Locatie" value={lead.office_address} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Lease Expiratie" value={lead.expiration_year} />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Lease Duur" value={lead.lease_duration} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Verhuizing" value={lead.relocation_start} />
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lead.cfo_email} isEmail />
                  <InfoRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={lead.linkedin_page} isLink />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Gevonden op" value={new Date(lead.gevonden_op).toLocaleDateString("nl-NL")} />
                </div>

                {lead.snippet && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-2">Bedrijfsomschrijving</h4>
                      <p className={`text-sm text-muted-foreground ${!showFullSnippet ? "line-clamp-4" : ""}`}>
                        {lead.snippet}
                      </p>
                      {lead.snippet.length > 150 && (
                        <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto text-xs" onClick={() => setShowFullSnippet(!showFullSnippet)}>
                          {showFullSnippet ? "Minder tonen" : "Meer tonen"}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-6">
                  {lead.website && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={lead.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Website
                      </a>
                    </Button>
                  )}
                  {lead.linkedin_page && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={lead.linkedin_page} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* Right: Notes */}
          <Card className="lg:col-span-3 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">
                Notities ({notes.length})
              </h3>
              <Button size="sm" onClick={() => setShowNoteForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nieuwe notitie
              </Button>
            </div>

            {showNoteForm && (
              <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
                <Textarea
                  placeholder="Typ hier je notitie..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  rows={4}
                  className="mb-3"
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <Select value={newNoteType} onValueChange={setNewNoteType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type notitie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Algemeen</SelectItem>
                      <SelectItem value="contact_attempt">Contact poging</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="proposal">Voorstel verstuurd</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setShowNoteForm(false)}>Annuleer</Button>
                    <Button size="sm" onClick={handleSaveNote}>
                      <Save className="mr-2 h-4 w-4" /> Opslaan
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {notes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p>Nog geen notities toegevoegd</p>
                </div>
              )}
              {notes.map(note => (
                <Card key={note.id} className={`p-4 ${note.is_pinned ? "border-primary border-2" : ""}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={noteTypeColors[note.note_type] || noteTypeColors.general}>
                        {noteTypeLabels[note.note_type] || "Algemeen"}
                      </Badge>
                      {note.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(note.id)}>
                          <Pin className="mr-2 h-4 w-4" />
                          {note.is_pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.note_text); }}>
                          <Edit className="mr-2 h-4 w-4" /> Bewerk
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Verwijder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <Textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={3} />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Annuleer</Button>
                        <Button size="sm" onClick={() => handleUpdateNote(note.id)}>Opslaan</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3">{note.note_text}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(note.created_at)}</span>
                    {note.created_by && <span className="flex items-center gap-1"><User className="h-3 w-3" />{note.created_by}</span>}
                    {note.created_at !== note.updated_at && <span className="italic">(bewerkt)</span>}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
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
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">{value}</a>
        ) : isEmail ? (
          <a href={`mailto:${value}`} className="text-sm text-primary hover:underline">{value}</a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
