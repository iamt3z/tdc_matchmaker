"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoteForm } from "./note-form";
import { NoteList } from "./note-list";

export function NotesCard({ customerId }: { customerId: string }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Notes</CardTitle>
        <CardDescription>
          Private record of your conversations and follow-ups for this person.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <NoteForm customerId={customerId} />
        <NoteList customerId={customerId} />
      </CardContent>
    </Card>
  );
}