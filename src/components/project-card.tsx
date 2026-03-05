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
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progress =
    project.totalRows > 0
      ? Math.round((project.currentRow / project.totalRows) * 100)
      : 0;
  const status = statusConfig[project.status] ?? statusConfig.not_started;

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
          <CardTitle className="text-base hover:underline">
            {project.name}
          </CardTitle>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
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
  );
}
