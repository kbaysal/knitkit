"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getBookmarks(documentId: string) {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.documentId, documentId),
        eq(bookmarks.clerkUserId, userId)
      )
    )
    .orderBy(bookmarks.pageNumber, bookmarks.createdAt);
}

export async function createBookmark(
  documentId: string,
  pageNumber: number,
  name: string,
  yPosition?: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [bookmark] = await db
    .insert(bookmarks)
    .values({
      documentId,
      clerkUserId: userId,
      pageNumber,
      name,
      yPosition: yPosition ?? null,
    })
    .returning();

  return bookmark;
}

export async function updateBookmark(id: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(bookmarks)
    .set({ name })
    .where(and(eq(bookmarks.id, id), eq(bookmarks.clerkUserId, userId)));
}

export async function deleteBookmark(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.clerkUserId, userId)));
}
