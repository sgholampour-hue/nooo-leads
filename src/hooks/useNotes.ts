import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadNote } from "@/types/leads";
import { validateNote } from "@/lib/validation";

export function useNotes(
  allNotes: LeadNote[],
  _setAllNotes: (notes: LeadNote[]) => void,
  leadId: string
) {
  const notes = allNotes
    .filter(n => n.lead_id === leadId)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // OWASP: Validate note input before database insertion
  const addNote = async (noteText: string, noteType: string, createdBy = "Gebruiker") => {
    const validation = validateNote({ note_text: noteText, note_type: noteType, created_by: createdBy });
    if (!validation.success) {
      console.error("Note validation failed:", validation.error);
      return null;
    }
    const { data, error } = await supabase.from("lead_notes").insert({
      lead_id: leadId,
      note_text: validation.data.note_text,
      note_type: validation.data.note_type || "general",
      created_by: validation.data.created_by || "Gebruiker",
    }).select().single();
    if (error) console.error("Error adding note:", error);
    return data as LeadNote | null;
  };

  // OWASP: Validate note text length before update
  const updateNote = async (noteId: string, noteText: string) => {
    const validation = validateNote({ note_text: noteText });
    if (!validation.success) {
      console.error("Note validation failed:", validation.error);
      return;
    }
    const { error } = await supabase.from("lead_notes").update({ note_text: validation.data.note_text }).eq("id", noteId);
    if (error) console.error("Error updating note:", error);
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
    if (error) console.error("Error deleting note:", error);
  };

  const togglePin = async (noteId: string) => {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    const { error } = await supabase.from("lead_notes").update({ is_pinned: !note.is_pinned }).eq("id", noteId);
    if (error) console.error("Error toggling pin:", error);
  };

  return { notes, addNote, updateNote, deleteNote, togglePin };
}
