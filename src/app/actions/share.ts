"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shareTokens, projects, documents, annotations, notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function getShareToken(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.projectId, projectId));

  return result[0] ?? null;
}

export async function toggleShareLink(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.clerkUserId, userId)));
  if (!project[0]) throw new Error("Not found");

  const existing = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.projectId, projectId));

  if (existing[0]) {
    // Toggle active state
    const result = await db
      .update(shareTokens)
      .set({ isActive: !existing[0].isActive })
      .where(eq(shareTokens.id, existing[0].id))
      .returning();
    revalidatePath(`/dashboard/projects/${projectId}`);
    return result[0];
  } else {
    // Create new token
    const token = randomBytes(16).toString("hex");
    const result = await db
      .insert(shareTokens)
      .values({ projectId, token })
      .returning();
    revalidatePath(`/dashboard/projects/${projectId}`);
    return result[0];
  }
}

export async function getSharedProject(token: string) {
  const result = await db
    .select()
    .from(shareTokens)
    .where(and(eq(shareTokens.token, token), eq(shareTokens.isActive, true)));

  if (!result[0]) return null;

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, result[0].projectId));

  if (!project[0]) return null;

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, project[0].id));

  const projectNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, project[0].id));

  return {
    project: project[0],
    document: doc[0] ?? null,
    notes: projectNotes[0] ?? null,
  };
}
