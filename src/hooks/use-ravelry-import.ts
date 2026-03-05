"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";

async function fetchPatternDetails(
  patternId: number | undefined | null
): Promise<Record<string, unknown> | null> {
  if (!patternId) return null;
  try {
    const res = await fetch(`/api/ravelry/pattern/${patternId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useRavelryImport({
  onCreated,
  navigateToProject = false,
}: {
  onCreated?: () => void;
  navigateToProject?: boolean;
} = {}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function importPattern(
    name: string,
    metadata: Record<string, unknown>
  ) {
    setLoading(true);
    try {
      const patternId = metadata.ravelryPatternId as number | undefined;
      const details = await fetchPatternDetails(patternId);
      const enriched = details
        ? { ...metadata, ...details, source: metadata.source }
        : metadata;
      const project = await createProject({
        name,
        ravelryMetadata: enriched,
      });
      onCreated?.();
      if (navigateToProject && project) {
        router.push(`/dashboard/projects/${project.id}`);
      }
      return project;
    } finally {
      setLoading(false);
    }
  }

  return { importPattern, loading };
}
