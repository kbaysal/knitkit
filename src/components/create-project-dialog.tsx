"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Library,
  FolderOpen,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { createProject } from "@/app/actions/projects";
import { useRavelryImport } from "@/hooks/use-ravelry-import";
import { useRavelryData } from "@/hooks/use-ravelry-data";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleCreated() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="library">My Library</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" forceMount className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <ManualTab onCreated={handleCreated} />
          </TabsContent>
          <TabsContent value="library" forceMount className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <RavelryLibraryTab onCreated={handleCreated} />
          </TabsContent>
          <TabsContent value="projects" forceMount className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <RavelryProjectsTab onCreated={handleCreated} />
          </TabsContent>
          <TabsContent value="search" forceMount className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <RavelrySearchTab onCreated={handleCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ── Manual creation ── */
function ManualTab({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [totalRows, setTotalRows] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createProject({
        name: name.trim(),
        totalRows: totalRows ? parseInt(totalRows, 10) : undefined,
      });
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Sweater Pattern"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="totalRows">Total Rows (optional)</Label>
        <Input
          id="totalRows"
          type="number"
          min="0"
          value={totalRows}
          onChange={(e) => setTotalRows(e.target.value)}
          placeholder="e.g. 200"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}

/* ── Ravelry connection guard ── */
function RavelryNotConnected() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Connect your Ravelry account to browse patterns.
      </p>
      <Button asChild>
        <a href="/api/ravelry/auth">
          <ExternalLink className="mr-2 h-4 w-4" />
          Connect to Ravelry
        </a>
      </Button>
    </div>
  );
}

/* ── Import button for a Ravelry item ── */
function ImportButton({
  name,
  metadata,
  onCreated,
}: {
  name: string;
  metadata: Record<string, unknown>;
  onCreated: () => void;
}) {
  const { importPattern, loading } = useRavelryImport({ onCreated });

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => importPattern(name, metadata)}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Import"}
    </Button>
  );
}

/* ── Ravelry Library ── */
function RavelryLibraryTab({ onCreated }: { onCreated: () => void }) {
  const {
    connected,
    libraryItems,
    libraryLoading,
    libraryLoaded,
    libraryHasMore,
    libraryError,
    loadLibrary,
    loadMoreLibrary,
  } = useRavelryData();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!libraryLoaded || libraryLoading || !libraryHasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLibrary();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [libraryLoaded, libraryLoading, libraryHasMore, loadMoreLibrary]);

  if (!connected) return <RavelryNotConnected />;

  if (!libraryLoaded && !libraryLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Library className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Import a pattern from your Ravelry library.
        </p>
        <Button onClick={loadLibrary}>
          <Library className="mr-2 h-4 w-4" />
          Load My Library
        </Button>
      </div>
    );
  }

  if (!libraryLoading && libraryLoaded && libraryItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Your Ravelry library is empty.
      </p>
    );
  }

  if (libraryError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-sm text-destructive">{libraryError}</p>
        <Button variant="outline" onClick={loadMoreLibrary}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-2 pt-2 max-h-[50vh] overflow-y-auto">
      {libraryItems.map((item) => {
        const pattern = item.pattern;
        const name = pattern?.name || item.title || `Library item #${item.id}`;
        const photo =
          item.first_photo?.small_url ||
          item.first_photo?.square_url ||
          item.first_photo?.medium_url ||
          pattern?.first_photo?.small_url ||
          item.square_image_url ||
          item.cover_image_url ||
          item.small_image_url;
        const designer = pattern?.designer?.name || item.author_name;
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="h-12 w-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Library className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              {designer && (
                <p className="text-xs text-muted-foreground">
                  by {designer}
                </p>
              )}
            </div>
            <ImportButton
              name={name}
              metadata={{
                source: "library",
                ravelryPatternId: pattern?.id || item.pattern_id,
                permalink: pattern?.permalink,
                designer,
                photoUrl:
                  pattern?.first_photo?.medium_url || item.cover_image_url,
                craft: pattern?.craft?.name,
                free: pattern?.free,
                gaugeDescription: pattern?.gauge_description,
                yarnWeight: pattern?.yarn_weight_description,
              }}
              onCreated={onCreated}
            />
          </div>
        );
      })}
      {libraryLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {libraryHasMore && !libraryLoading && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}

/* ── Ravelry Projects ── */
function RavelryProjectsTab({ onCreated }: { onCreated: () => void }) {
  const {
    connected,
    projectItems,
    projectsLoading,
    projectsLoaded,
    projectsHasMore,
    projectsError,
    loadProjects,
    loadMoreProjects,
  } = useRavelryData();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!projectsLoaded || projectsLoading || !projectsHasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreProjects();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [projectsLoaded, projectsLoading, projectsHasMore, loadMoreProjects]);

  if (!connected) return <RavelryNotConnected />;

  if (!projectsLoaded && !projectsLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Import from your Ravelry projects.
        </p>
        <Button onClick={loadProjects}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Load My Projects
        </Button>
      </div>
    );
  }

  if (!projectsLoading && projectsLoaded && projectItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No Ravelry projects found.
      </p>
    );
  }

  if (projectsError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-sm text-destructive">{projectsError}</p>
        <Button variant="outline" onClick={loadMoreProjects}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-2 pt-2 max-h-[50vh] overflow-y-auto">
      {projectItems.map((proj) => (
        <div
          key={proj.id}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          {proj.first_photo?.small_url && (
            <img
              src={proj.first_photo.small_url}
              alt={proj.name}
              className="h-12 w-12 rounded-md object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{proj.name}</p>
            <div className="flex items-center gap-2">
              {proj.pattern_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {proj.pattern_name}
                </p>
              )}
              {proj.status_name && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {proj.status_name}
                </Badge>
              )}
            </div>
          </div>
          <ImportButton
            name={proj.name}
            metadata={{
              source: "project",
              ravelryProjectId: proj.id,
              ravelryPatternId: proj.pattern_id,
              patternName: proj.pattern_name,
              photoUrl: proj.first_photo?.medium_url,
              statusName: proj.status_name,
              progress: proj.progress,
              craft: proj.craft_name,
            }}
            onCreated={onCreated}
          />
        </div>
      ))}
      {projectsLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {projectsHasMore && !projectsLoading && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}

/* ── Ravelry Search ── */
function RavelrySearchTab({ onCreated }: { onCreated: () => void }) {
  const [query, setQuery] = useState("");
  const {
    connected,
    searchResults,
    searchLoading,
    searchError,
    searched,
    search,
  } = useRavelryData();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await search(query);
  }

  if (!connected) return <RavelryNotConnected />;

  return (
    <div className="space-y-3 pt-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search Ravelry patterns..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={searchLoading}>
          {searchLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {searchError && <p className="text-sm text-destructive">{searchError}</p>}

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          {searchResults.map((pattern) => (
            <div
              key={pattern.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {pattern.first_photo?.small_url && (
                <img
                  src={pattern.first_photo.small_url}
                  alt={pattern.name}
                  className="h-12 w-12 rounded-md object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{pattern.name}</p>
                <div className="flex items-center gap-2">
                  {pattern.designer?.name && (
                    <p className="text-xs text-muted-foreground">
                      by {pattern.designer.name}
                    </p>
                  )}
                  {pattern.free && (
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  )}
                </div>
              </div>
              <ImportButton
                name={pattern.name}
                metadata={{
                  source: "search",
                  ravelryPatternId: pattern.id,
                  permalink: pattern.permalink,
                  designer: pattern.designer?.name,
                  photoUrl: pattern.first_photo?.medium_url,
                  craft: pattern.craft?.name,
                  free: pattern.free,
                  gaugeDescription: pattern.gauge_description,
                  yarnWeight: pattern.yarn_weight_description,
                }}
                onCreated={onCreated}
              />
            </div>
          ))}
        </div>
      )}

      {searched && searchResults.length === 0 && !searchError && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No patterns found. Try a different search.
        </p>
      )}
    </div>
  );
}
