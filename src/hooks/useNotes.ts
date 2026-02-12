import { useState, useCallback } from "react";
import { LeadNote } from "@/types/leads";

export function useNotes(
  allNotes: LeadNote[],
  setAllNotes: (notes: LeadNote[]) => void,
  leadId: string
) {
  const notes = allNotes
    .filter(n => n.lead_id === leadId)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const addNote = (noteText: string, noteType: string, createdBy = "Gebruiker") => {
    const newNote: LeadNote = {
      id: crypto.randomUUID(),
      lead_id: leadId,
      note_text: noteText,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      note_type: noteType,
      is_pinned: false,
    };
    setAllNotes([...allNotes, newNote]);
    return newNote;
  };

  const updateNote = (noteId: string, noteText: string) => {
    setAllNotes(allNotes.map(n => n.id === noteId ? { ...n, note_text: noteText, updated_at: new Date().toISOString() } : n));
  };

  const deleteNote = (noteId: string) => {
    setAllNotes(allNotes.filter(n => n.id !== noteId));
  };

  const togglePin = (noteId: string) => {
    setAllNotes(allNotes.map(n => n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n));
  };

  return { notes, addNote, updateNote, deleteNote, togglePin };
}
