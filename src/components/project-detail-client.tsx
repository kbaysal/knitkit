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
import { Separator } from "@/components/ui/separator";

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
    ravelryMetadata?: Record<string, unknown> | null;
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
    <div className="flex flex-col h-full min-h-0 gap-4">
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
      <Tabs defaultValue="pattern" className="flex flex-col min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="pattern">Pattern</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          {project.ravelryMetadata && (
            <TabsTrigger value="details">Details</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pattern" className="mt-4 flex flex-col min-h-0 flex-1">
          {document ? (
            <PdfViewer
              document={document}
              floatingRowCounter={
                <RowCounter
                  projectId={project.id}
                  currentRow={currentRow}
                  totalRows={project.totalRows}
                  onRowChange={setCurrentRow}
                />
              }
              floatingTimer={
                <ProjectTimer
                  projectId={project.id}
                  sessions={timerSessions}
                  activeSession={activeTimer}
                />
              }
            />
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

        {project.ravelryMetadata && (
          <TabsContent value="details" className="mt-4">
            <RavelryDetailsTab metadata={project.ravelryMetadata} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function RavelryDetailsTab({ metadata }: { metadata: Record<string, unknown> }) {
  const m = metadata;
  const introductionHtml = typeof m.introduction_html === "string" ? m.introduction_html : null;
  const sizesAvailable = typeof m.sizes_available === "string" ? m.sizes_available : null;
  const designer = typeof m.designer === "string" ? m.designer : null;
  const permalink = typeof m.permalink === "string" ? m.permalink : null;
  const craft = typeof m.craft === "string" ? m.craft : null;
  const yarnWeight = typeof m.yarn_weight === "string" ? m.yarn_weight : null;
  const gaugeDesc = typeof m.gauge_description === "string" ? m.gauge_description : null;
  const gauge = typeof m.gauge === "number" ? m.gauge : null;
  const gaugeDivisor = typeof m.gauge_divisor === "number" ? m.gauge_divisor : null;
  const yardage = typeof m.yardage === "number" ? m.yardage : null;
  const yardageMax = typeof m.yardage_max === "number" ? m.yardage_max : null;
  const needleSizes = Array.isArray(m.needle_sizes) ? m.needle_sizes : null;
  const diffAvg = typeof m.difficulty_average === "number" ? m.difficulty_average : null;
  const diffCount = typeof m.difficulty_count === "number" ? m.difficulty_count : null;
  const ratingAvg = typeof m.rating_average === "number" ? m.rating_average : null;
  const ratingCount = typeof m.rating_count === "number" ? m.rating_count : null;
  const packs = Array.isArray(m.packs) ? m.packs as { yarn_name?: string | null; yarn_company?: string | null; yarn_id?: number | null; yarn_permalink?: string | null; colorway?: string | null; quantity_description?: string | null; skeins?: number | null; total_grams?: number | null; total_yards?: number | null; total_meters?: number | null; yarn_weight?: string | null; min_gauge?: number | null; max_gauge?: number | null; gauge_divisor?: number | null; grams?: number | null; yardage?: number | null; suggested_needles?: string[] }[] : null;

  const specs: { label: string; value: string }[] = [];
  if (designer) {
    specs.push({ label: "Designer", value: designer });
  }
  if (craft) specs.push({ label: "Craft", value: craft });
  if (yarnWeight) specs.push({ label: "Yarn Weight", value: yarnWeight });
  if (gaugeDesc) {
    specs.push({ label: "Gauge", value: gaugeDesc });
  } else if (gauge && gaugeDivisor) {
    specs.push({ label: "Gauge", value: `${gauge} sts / ${gaugeDivisor} inches` });
  }
  if (needleSizes && needleSizes.length > 0) {
    const display = needleSizes
      .map((n: { name?: string; us?: string; metric?: number }) =>
        n.us ? `US ${n.us} (${n.metric}mm)` : n.name ?? ""
      )
      .filter(Boolean)
      .join(", ");
    if (display) specs.push({ label: "Needle Sizes", value: display });
  }
  if (yardage) {
    const display = yardageMax && yardageMax !== yardage
      ? `${yardage} – ${yardageMax} yards`
      : `${yardage} yards`;
    specs.push({ label: "Yardage", value: display });
  }

  return (
    <div className="space-y-6">
      {specs.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Pattern Specs</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {specs.map((s) => (
              <div key={s.label} className="rounded-lg border px-4 py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {packs && packs.length > 0 && packs.some((p) => p.yarn_name) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Suggested Yarn</h3>
          <div className="grid gap-3">
            {packs.filter((p) => p.yarn_name).map((p, i) => (
              <div key={i} className="rounded-lg border px-4 py-3 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{p.yarn_name}</p>
                    {p.yarn_company && (
                      <p className="text-xs text-muted-foreground">{p.yarn_company}</p>
                    )}
                  </div>
                  {p.yarn_permalink && (
                    <a
                      href={`https://www.ravelry.com/yarns/library/${p.yarn_permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-primary hover:underline"
                    >
                      View yarn ↗
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {p.yarn_weight && (
                    <div><span className="text-muted-foreground">Weight:</span> {p.yarn_weight}</div>
                  )}
                  {(p.min_gauge != null || p.max_gauge != null) && p.gauge_divisor && (
                    <div>
                      <span className="text-muted-foreground">Gauge:</span>{" "}
                      {p.min_gauge != null && p.max_gauge != null && p.min_gauge !== p.max_gauge
                        ? `${p.min_gauge}–${p.max_gauge} sts / ${p.gauge_divisor} in`
                        : `${p.min_gauge ?? p.max_gauge} sts / ${p.gauge_divisor} in`}
                    </div>
                  )}
                  {p.suggested_needles && p.suggested_needles.length > 0 && (
                    <div className="col-span-2"><span className="text-muted-foreground">Needles:</span> {p.suggested_needles.join(", ")}</div>
                  )}
                  {p.grams && (
                    <div><span className="text-muted-foreground">Skein:</span> {p.grams}g{p.yardage ? ` / ${p.yardage} yds` : ""}</div>
                  )}
                  {p.colorway && (
                    <div><span className="text-muted-foreground">Colorway:</span> {p.colorway}</div>
                  )}
                  {(p.quantity_description || p.skeins) && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Qty:</span>{" "}
                      {p.quantity_description ?? `${p.skeins} skein${p.skeins !== 1 ? "s" : ""}`}
                      {p.total_yards ? ` (${p.total_yards} yds total)` : p.total_meters ? ` (${p.total_meters}m total)` : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sizesAvailable && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Sizes Available</h3>
          <p className="text-sm text-muted-foreground">{sizesAvailable}</p>
        </div>
      )}

      {introductionHtml && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Description</h3>
          <div
            className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: introductionHtml }}
          />
        </div>
      )}

      {(diffAvg != null || ratingAvg != null) && (
        <>
          <Separator />
          <div className="flex gap-8">
            {diffAvg != null && (
              <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p className="text-sm font-medium">
                  {diffAvg.toFixed(1)} / 10
                  {diffCount ? <span className="text-xs text-muted-foreground ml-1">({diffCount} ratings)</span> : null}
                </p>
              </div>
            )}
            {ratingAvg != null && (
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="text-sm font-medium">
                  {ratingAvg.toFixed(2)} / 5
                  {ratingCount ? <span className="text-xs text-muted-foreground ml-1">({ratingCount} ratings)</span> : null}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {permalink && (
        <>
          <Separator />
          <a
            href={`https://www.ravelry.com/patterns/library/${permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View on Ravelry ↗
          </a>
        </>
      )}
    </div>
  );
}
