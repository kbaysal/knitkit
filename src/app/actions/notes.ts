"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { notes, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotes(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId));

  return result[0] ?? null;
}

export async function saveNotes(projectId: string, content: object) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId));

  if (existing[0]) {
    await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, existing[0].id));
  } else {
    await db.insert(notes).values({ projectId, content });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
}
