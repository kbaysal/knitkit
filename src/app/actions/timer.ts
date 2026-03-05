"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { timerSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function getTimerSessions(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(timerSessions)
    .where(eq(timerSessions.projectId, projectId))
    .orderBy(timerSessions.startedAt);
}

export async function getActiveTimer(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .select()
    .from(timerSessions)
    .where(
      and(
        eq(timerSessions.projectId, projectId),
        isNull(timerSessions.endedAt)
      )
    );

  return result[0] ?? null;
}

export async function startTimer(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(timerSessions)
    .values({ projectId, startedAt: new Date() })
    .returning();

  return result[0];
}

export async function stopTimer(sessionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .update(timerSessions)
    .set({ endedAt: new Date() })
    .where(eq(timerSessions.id, sessionId))
    .returning();

  return result[0];
}
