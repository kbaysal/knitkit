import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { getDocumentByProject } from "@/app/actions/documents";
import { getNotes } from "@/app/actions/notes";
import { getTimerSessions, getActiveTimer } from "@/app/actions/timer";
import { getProgressPhotos } from "@/app/actions/photos";
import { getShareToken } from "@/app/actions/share";
import { ProjectDetailClient } from "@/components/project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [document, notesData, timerSessions, activeTimer, photos, shareToken] =
    await Promise.all([
      getDocumentByProject(id),
      getNotes(id),
      getTimerSessions(id),
      getActiveTimer(id),
      getProgressPhotos(id),
      getShareToken(id),
    ]);

  return (
    <ProjectDetailClient
      project={project}
      document={document}
      notes={notesData}
      timerSessions={timerSessions}
      activeTimer={activeTimer}
      photos={photos}
      shareToken={shareToken}
    />
  );
}
