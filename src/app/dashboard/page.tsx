import { getProjectsWithThumbnails } from "@/app/actions/projects";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export default async function DashboardPage() {
  const projectList = await getProjectsWithThumbnails();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <CreateProjectDialog />
      </div>

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              thumbnailUrl={project.thumbnailUrl}
              ravelryPhotoUrl={project.ravelryPhotoUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
