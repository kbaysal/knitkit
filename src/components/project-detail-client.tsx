"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProject } from "@/app/actions/projects";
import { toggleShareLink } from "@/app/actions/share";
import { PdfViewer } from "@/components/pdf-viewer";
import { PdfUpload } from "@/components/pdf-upload";
import { RowCounter } from "@/components/row-counter";
import { ProjectTimer } from "@/components/project-timer";
import { ProjectNotes } from "@/components/project-notes";
import { ProgressPhotos } from "@/components/progress-photos";
import { Progress } from "@/components/ui/progress";

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "frogged", label: "Frogged" },
  { value: "completed", label: "Completed" },
];

interface ProjectDetailClientProps {
  project: {
    id: string;
    name: string;
    status: string;
    currentRow: number;
    totalRows: number;
  };
  document: {
    id: string;
    blobUrl: string;
    filename: string;
    pageCount: number;
    rulerPositions: unknown;
  } | null;
  notes: { id: string; content: unknown } | null;
  timerSessions: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
  }[];
  activeTimer: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
  } | null;
  photos: {
    id: string;
    blobUrl: string;
    caption: string | null;
    takenAt: Date;
  }[];
  shareToken?: {
    token: string;
    isActive: boolean;
  } | null;
}

export function ProjectDetailClient({
  project,
  document,
  notes,
  timerSessions,
  activeTimer,
  photos,
  shareToken,
}: ProjectDetailClientProps) {
  const [status, setStatus] = useState(project.status);
  const [currentRow, setCurrentRow] = useState(project.currentRow);
  const [sharing, setSharing] = useState(shareToken?.isActive ?? false);
  const [shareTokenValue] = useState(shareToken?.token ?? "");
  const progress =
    project.totalRows > 0
      ? Math.round((currentRow / project.totalRows) * 100)
      : 0;

  async function handleStatusChange(value: string) {
    setStatus(value);
    await updateProject(project.id, {
      status: value as "not_started" | "in_progress" | "frogged" | "completed",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await toggleShareLink(project.id);
              setSharing((s) => !s);
            }}
          >
            <Share2 className="mr-1 h-4 w-4" />
            {sharing ? "Unshare" : "Share"}
          </Button>
          {document && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`/api/export-pdf?documentId=${document.id}`, "_blank");
              }}
            >
              <Download className="mr-1 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {project.totalRows > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Row {currentRow} / {project.totalRows}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}

      {/* Share link */}
      {sharing && shareTokenValue && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Share link: </span>
          <code className="rounded bg-background px-2 py-0.5 text-xs">
            {typeof window !== "undefined"
              ? `${window.location.origin}/shared/${shareTokenValue}`
              : `/shared/${shareTokenValue}`}
          </code>
        </div>
      )}

      {/* Row counter + Timer inline */}
      <div className="flex flex-wrap gap-4">
        <RowCounter
          projectId={project.id}
          currentRow={currentRow}
          totalRows={project.totalRows}
          onRowChange={setCurrentRow}
        />
        <ProjectTimer
          projectId={project.id}
          sessions={timerSessions}
          activeSession={activeTimer}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pattern" className="w-full">
        <TabsList>
          <TabsTrigger value="pattern">Pattern</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="pattern" className="mt-4">
          {document ? (
            <PdfViewer document={document} />
          ) : (
            <PdfUpload projectId={project.id} />
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ProjectNotes projectId={project.id} initialNotes={notes} />
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <ProgressPhotos projectId={project.id} initialPhotos={photos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
