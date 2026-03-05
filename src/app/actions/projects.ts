"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(projects)
    .values({
      clerkUserId: userId,
      name: data.name,
      totalRows: data.totalRows ?? 0,
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
