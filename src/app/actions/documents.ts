"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDocumentByProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.clerkUserId, userId)));

  if (!project[0]) throw new Error("Project not found");

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId));

  return docs[0] ?? null;
}

export async function createDocument(data: {
  projectId: string;
  blobUrl: string;
  filename: string;
  pageCount: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(documents).values(data).returning();
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return result[0];
}

export async function updateRulerPosition(
  documentId: string,
  pageNumber: number,
  position: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc[0]) throw new Error("Document not found");

  const positions = (doc[0].rulerPositions as Record<string, number>) ?? {};
  positions[String(pageNumber)] = position;

  await db
    .update(documents)
    .set({ rulerPositions: positions })
    .where(eq(documents.id, documentId));
}
