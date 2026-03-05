"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customGlossary } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCustomGlossaryEntries() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(customGlossary)
    .where(eq(customGlossary.clerkUserId, userId))
    .orderBy(customGlossary.abbreviation);
}

export async function addGlossaryEntry(data: {
  abbreviation: string;
  description: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(customGlossary)
    .values({
      clerkUserId: userId,
      abbreviation: data.abbreviation,
      description: data.description,
    })
    .returning();

  revalidatePath("/dashboard/glossary");
  return result[0];
}

export async function deleteGlossaryEntry(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(customGlossary)
    .where(
      and(eq(customGlossary.id, id), eq(customGlossary.clerkUserId, userId))
    );

  revalidatePath("/dashboard/glossary");
}
