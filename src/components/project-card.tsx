"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/projects";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  not_started: { label: "Not Started", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  frogged: { label: "Frogged", variant: "destructive" },
  completed: { label: "Completed", variant: "secondary" },
};

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    currentRow: number;
    totalRows: number;
  };
  thumbnailUrl?: string | null;
  ravelryPhotoUrl?: string | null;
}

export function ProjectCard({ project, thumbnailUrl, ravelryPhotoUrl }: ProjectCardProps) {
  const progress =
    project.totalRows > 0
      ? Math.round((project.currentRow / project.totalRows) * 100)
      : 0;
  const status = statusConfig[project.status] ?? statusConfig.not_started;
  const imageUrl = thumbnailUrl || ravelryPhotoUrl || null;

  return (
    <Link href={`/dashboard/projects/${project.id}`} className="block">
      <Card className={`relative overflow-hidden transition-colors hover:bg-muted/50${imageUrl ? " pt-0" : ""}`}>
        {imageUrl && (
          <div className="aspect-[16/9] w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex-1">
            {project.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={async (e) => {
                  e.preventDefault();
                  if (confirm("Delete this project? This cannot be undone.")) {
                    await deleteProject(project.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <Badge variant={status.variant} className="mb-3">
            {status.label}
          </Badge>
          {project.totalRows > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Row {project.currentRow} / {project.totalRows}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
