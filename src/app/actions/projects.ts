"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, progressPhotos } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(projects)
    .where(eq(projects.clerkUserId, userId))
    .orderBy(projects.updatedAt);
}

export async function getProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.clerkUserId, userId)));

  return result[0] ?? null;
}

export async function createProject(data: {
  name: string;
  totalRows?: number;
  ravelryMetadata?: Record<string, unknown>;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(projects)
    .values({
      clerkUserId: userId,
      name: data.name,
      totalRows: data.totalRows ?? 0,
      ravelryMetadata: data.ravelryMetadata ?? null,
    })
    .returning();

  revalidatePath("/dashboard");
  return result[0];
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    status?: "not_started" | "in_progress" | "frogged" | "completed";
    currentRow?: number;
    totalRows?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.clerkUserId, userId)))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${id}`);
  return result[0];
}

export async function deleteProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.clerkUserId, userId)));

  revalidatePath("/dashboard");
}

export async function getProjectsWithThumbnails() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const latestPhoto = db
    .select({
      projectId: progressPhotos.projectId,
      blobUrl: sql<string>`(
        SELECT ${progressPhotos.blobUrl}
        FROM ${progressPhotos} pp2
        WHERE pp2.project_id = ${progressPhotos.projectId}
        ORDER BY pp2.taken_at DESC
        LIMIT 1
      )`.as("blob_url"),
    })
    .from(progressPhotos)
    .groupBy(progressPhotos.projectId)
    .as("latest_photo");

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      currentRow: projects.currentRow,
      totalRows: projects.totalRows,
      ravelryMetadata: projects.ravelryMetadata,
      updatedAt: projects.updatedAt,
      thumbnailUrl: latestPhoto.blobUrl,
    })
    .from(projects)
    .leftJoin(latestPhoto, eq(projects.id, latestPhoto.projectId))
    .where(eq(projects.clerkUserId, userId))
    .orderBy(desc(projects.updatedAt));

  return rows.map((r) => {
    const meta = r.ravelryMetadata as Record<string, unknown> | null;
    const ravelryPhotoUrl = meta?.photoUrl ?? meta?.photo_url ?? null;
    return {
      ...r,
      thumbnailUrl: r.thumbnailUrl ?? null,
      ravelryPhotoUrl: typeof ravelryPhotoUrl === "string" ? ravelryPhotoUrl : null,
    };
  });
}
