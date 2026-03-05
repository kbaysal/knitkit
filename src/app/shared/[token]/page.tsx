import { notFound } from "next/navigation";
import { getSharedProject } from "@/app/actions/share";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  frogged: "Frogged",
  completed: "Completed",
};

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getSharedProject(token);

  if (!data) notFound();

  const { project } = data;
  const progress =
    project.totalRows > 0
      ? Math.round((project.currentRow / project.totalRows) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-2 text-sm text-muted-foreground">Shared Project (Read-only)</p>
      <h1 className="text-3xl font-bold">{project.name}</h1>
      <Badge variant="outline" className="mt-2">
        {statusLabels[project.status] ?? project.status}
      </Badge>

      {project.totalRows > 0 && (
        <div className="mt-6 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Row {project.currentRow} / {project.totalRows}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}
    </div>
  );
}
