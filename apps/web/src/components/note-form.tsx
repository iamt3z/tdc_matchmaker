"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNote } from "@/hooks/use-notes";
import { getApiErrorMessage } from "@/lib/api/client";
import type { NoteType } from "@/lib/api/types";
import { formatEnum } from "@/lib/format";

const NOTE_TYPES: NoteType[] = ["CALL", "MEETING", "EMAIL", "OTHER"];

export function NoteForm({ customerId }: { customerId: string }) {
  const [type, setType] = useState<NoteType>("CALL");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [followUpAction, setFollowUpAction] = useState("");
  const createNote = useCreateNote(customerId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are needed to save a note");
      return;
    }
    try {
      await createNote.mutateAsync({
        type,
        subject: subject.trim(),
        content: content.trim(),
        followUpAction: followUpAction.trim() || undefined,
      });
      setSubject("");
      setContent("");
      setFollowUpAction("");
      toast.success("Note saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-type">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as NoteType)}
          >
            <SelectTrigger id="note-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatEnum(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-subject">Subject</Label>
          <Input
            id="note-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief subject"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-content">Note</Label>
        <Textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="What was discussed…"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-followup">Follow-up (optional)</Label>
        <Input
          id="note-followup"
          value={followUpAction}
          onChange={(e) => setFollowUpAction(e.target.value)}
          placeholder="e.g. Call back next week"
        />
      </div>
      <Button type="submit" disabled={createNote.isPending}>
        {createNote.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Save note"
        )}
      </Button>
    </form>
  );
}