"use client";

import { useState, useEffect, useRef } from "react";
import {
  ExternalLink,
  Search,
  Link2,
  Loader2,
  Library,
  FolderOpen,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRavelryImport } from "@/hooks/use-ravelry-import";
import { useRavelryData } from "@/hooks/use-ravelry-data";

/* ── Import button (uses shared hook, navigates to project) ── */

function ImportButton({
  name,
  metadata,
}: {
  name: string;
  metadata: Record<string, unknown>;
}) {
  const { importPattern, loading } = useRavelryImport({
    navigateToProject: true,
  });

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => importPattern(name, metadata)}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Import as Project"}
    </Button>
  );
}

/* ── Not connected guard ── */

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

/* ── Main page ── */

export default function RavelryPage() {
  const { connected, checking, disconnect } = useRavelryData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ravelry</h1>
        <p className="text-muted-foreground">
          Connect your Ravelry account to search, browse, and import patterns.
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Ravelry Connection
          </CardTitle>
          <CardDescription>
            {connected
              ? "Your Ravelry account is connected."
              : "Connect your Ravelry account to search patterns."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : connected ? (
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-600">
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                Browse your library or search patterns below.
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                onClick={disconnect}
              >
                <LogOut className="mr-1 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button asChild>
              <a href="/api/ravelry/auth">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect to Ravelry
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Search / My Library / My Projects */}
      {connected && (
        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="library">
              <Library className="mr-2 h-4 w-4" />
              My Library
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderOpen className="mr-2 h-4 w-4" />
              My Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <SearchTab />
          </TabsContent>
          <TabsContent value="library" forceMount className="mt-4 data-[state=inactive]:hidden">
            <LibraryTab />
          </TabsContent>
          <TabsContent value="projects" forceMount className="mt-4 data-[state=inactive]:hidden">
            <ProjectsTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ── Search tab ── */

function SearchTab() {
  const [query, setQuery] = useState("");
  const { searchResults, searchLoading, searchError, searched, search } =
    useRavelryData();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await search(query);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Patterns
        </CardTitle>
        <CardDescription>
          Search the Ravelry pattern database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search patterns (e.g. 'cabled scarf')..."
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

        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {searchResults.map((pattern) => (
              <div
                key={pattern.id}
                className="flex gap-3 rounded-lg border p-3"
              >
                {pattern.first_photo?.small_url && (
                  <img
                    src={pattern.first_photo.small_url}
                    alt={pattern.name}
                    className="h-16 w-16 rounded-md object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pattern.name}</p>
                  {pattern.designer?.name && (
                    <p className="text-sm text-muted-foreground">
                      by {pattern.designer.name}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {pattern.free && (
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    )}
                    {pattern.craft?.name && (
                      <Badge variant="outline" className="text-xs">
                        {pattern.craft.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
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
                  />
                  <a
                    href={`https://www.ravelry.com/patterns/library/${pattern.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {searched && !searchLoading && searchResults.length === 0 && !searchError && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No results found. Try a different search term.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Library tab with infinite scroll ── */

function LibraryTab() {
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

  // Auto-load on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

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
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [libraryLoaded, libraryLoading, libraryHasMore, loadMoreLibrary]);

  if (!connected) return <RavelryNotConnected />;

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

  if (!libraryLoading && libraryLoaded && libraryItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Your Ravelry library is empty.
      </p>
    );
  }

  return (
    <div className="space-y-3">
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
                className="h-14 w-14 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Library className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              {designer && (
                <p className="text-xs text-muted-foreground">by {designer}</p>
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
            />
          </div>
        );
      })}
      {libraryLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {libraryHasMore && !libraryLoading && (
        <div ref={sentinelRef} className="h-4" />
      )}
    </div>
  );
}

/* ── Projects tab with infinite scroll ── */

function ProjectsTab() {
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

  // Auto-load on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [projectsLoaded, projectsLoading, projectsHasMore, loadMoreProjects]);

  if (!connected) return <RavelryNotConnected />;

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

  if (!projectsLoading && projectsLoaded && projectItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No Ravelry projects found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {projectItems.map((proj) => (
        <div
          key={proj.id}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          {proj.first_photo?.small_url ? (
            <img
              src={proj.first_photo.small_url}
              alt={proj.name}
              className="h-14 w-14 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
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
          />
        </div>
      ))}
      {projectsLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {projectsHasMore && !projectsLoading && (
        <div ref={sentinelRef} className="h-4" />
      )}
    </div>
  );
}
