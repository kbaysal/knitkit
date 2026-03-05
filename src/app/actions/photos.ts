"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { progressPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProgressPhotos(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(progressPhotos)
    .where(eq(progressPhotos.projectId, projectId))
    .orderBy(progressPhotos.takenAt);
}

export async function addProgressPhoto(data: {
  projectId: string;
  blobUrl: string;
  caption?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(progressPhotos).values(data).returning();
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return result[0];
}

export async function deleteProgressPhoto(id: string, projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(progressPhotos).where(eq(progressPhotos.id, id));
  revalidatePath(`/dashboard/projects/${projectId}`);
}
