"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { annotations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAnnotation(documentId: string, pageNumber: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .select()
    .from(annotations)
    .where(
      and(
        eq(annotations.documentId, documentId),
        eq(annotations.pageNumber, pageNumber)
      )
    );

  return result[0] ?? null;
}

export async function saveAnnotation(
  documentId: string,
  pageNumber: number,
  fabricJson: object
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db
    .select()
    .from(annotations)
    .where(
      and(
        eq(annotations.documentId, documentId),
        eq(annotations.pageNumber, pageNumber)
      )
    );

  if (existing[0]) {
    await db
      .update(annotations)
      .set({ fabricJson, updatedAt: new Date() })
      .where(eq(annotations.id, existing[0].id));
  } else {
    await db.insert(annotations).values({
      documentId,
      pageNumber,
      fabricJson,
    });
  }
}
