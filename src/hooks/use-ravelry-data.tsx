"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

/* ── Shared Ravelry types ── */

export interface RavelryPattern {
  id: number;
  name: string;
  designer?: { name: string };
  first_photo?: { medium_url: string; small_url: string };
  permalink: string;
  pattern_categories?: Array<{ name: string }>;
  craft?: { name: string };
  free?: boolean;
  gauge?: number;
  gauge_divisor?: number;
  gauge_description?: string;
  yarn_weight_description?: string;
  yardage?: number;
  yardage_max?: number;
}

export interface RavelryLibraryItem {
  id: number;
  pattern?: RavelryPattern;
  pattern_id?: number;
  title?: string;
  cover_image_url?: string;
  square_image_url?: string;
  small_image_url?: string;
  author_name?: string;
  first_photo?: {
    small_url?: string;
    medium_url?: string;
    square_url?: string;
  };
}

export interface RavelryProject {
  id: number;
  name: string;
  pattern_name?: string;
  pattern_id?: number;
  first_photo?: { medium_url: string; small_url: string };
  status_name?: string;
  craft_name?: string;
  progress?: number;
  completed?: string;
}

/* ── Context value ── */

interface RavelryDataContextValue {
  // Connection
  connected: boolean;
  checking: boolean;
  disconnect: () => void;

  // Library
  libraryItems: RavelryLibraryItem[];
  libraryLoading: boolean;
  libraryLoaded: boolean;
  libraryHasMore: boolean;
  libraryError: string | null;
  loadLibrary: () => void;
  loadMoreLibrary: () => void;

  // Projects
  projectItems: RavelryProject[];
  projectsLoading: boolean;
  projectsLoaded: boolean;
  projectsHasMore: boolean;
  projectsError: string | null;
  loadProjects: () => void;
  loadMoreProjects: () => void;

  // Search
  searchResults: RavelryPattern[];
  searchLoading: boolean;
  searchError: string | null;
  searched: boolean;
  search: (query: string) => Promise<void>;
}

const RavelryDataContext = createContext<RavelryDataContextValue | null>(null);

export function useRavelryData() {
  const ctx = useContext(RavelryDataContext);
  if (!ctx)
    throw new Error("useRavelryData must be used within RavelryDataProvider");
  return ctx;
}

/* ── Provider ── */

export function RavelryDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const ravelryStatus = searchParams.get("ravelry");

  // ── Connection ──
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (ravelryStatus === "connected") {
      setConnected(true);
      setChecking(false);
    } else {
      fetch("/api/ravelry/search?q=test")
        .then((res) => {
          if (res.ok) setConnected(true);
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    }
  }, [ravelryStatus]);

  function disconnect() {
    document.cookie = "ravelry_token=; path=/; max-age=0";
    setConnected(false);
  }

  // ── Library ──
  const [libraryItems, setLibraryItems] = useState<RavelryLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [libraryHasMore, setLibraryHasMore] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const libraryPageRef = useRef(0);

  const fetchLibraryPage = useCallback(async (pageNum: number) => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const res = await fetch(`/api/ravelry/library?page=${pageNum}`);
      if (res.status === 401) {
        setConnected(false);
        return;
      }
      if (!res.ok) {
        setLibraryError("Failed to load library");
        return;
      }
      const data = await res.json();
      const newItems: RavelryLibraryItem[] = data.volumes || [];
      setLibraryItems((prev) =>
        pageNum === 1 ? newItems : [...prev, ...newItems]
      );
      setLibraryHasMore(
        newItems.length >= 20 &&
          (data.paginator?.last_page == null ||
            pageNum < data.paginator.last_page)
      );
      libraryPageRef.current = pageNum;
      setLibraryLoaded(true);
    } catch {
      setLibraryError("Failed to load library");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const loadLibrary = useCallback(() => {
    if (!libraryLoaded && !libraryLoading) {
      fetchLibraryPage(1);
    }
  }, [libraryLoaded, libraryLoading, fetchLibraryPage]);

  const loadMoreLibrary = useCallback(() => {
    if (!libraryLoading && libraryHasMore) {
      fetchLibraryPage(libraryPageRef.current + 1);
    }
  }, [libraryLoading, libraryHasMore, fetchLibraryPage]);

  // ── Projects ──
  const [projectItems, setProjectItems] = useState<RavelryProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectsHasMore, setProjectsHasMore] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const projectsPageRef = useRef(0);

  const fetchProjectsPage = useCallback(async (pageNum: number) => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(`/api/ravelry/projects?page=${pageNum}`);
      if (res.status === 401) {
        setConnected(false);
        return;
      }
      if (!res.ok) {
        setProjectsError("Failed to load projects");
        return;
      }
      const data = await res.json();
      const newItems: RavelryProject[] = data.projects || [];
      setProjectItems((prev) =>
        pageNum === 1 ? newItems : [...prev, ...newItems]
      );
      setProjectsHasMore(
        newItems.length >= 20 &&
          (data.paginator?.last_page == null ||
            pageNum < data.paginator.last_page)
      );
      projectsPageRef.current = pageNum;
      setProjectsLoaded(true);
    } catch {
      setProjectsError("Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadProjects = useCallback(() => {
    if (!projectsLoaded && !projectsLoading) {
      fetchProjectsPage(1);
    }
  }, [projectsLoaded, projectsLoading, fetchProjectsPage]);

  const loadMoreProjects = useCallback(() => {
    if (!projectsLoading && projectsHasMore) {
      fetchProjectsPage(projectsPageRef.current + 1);
    }
  }, [projectsLoading, projectsHasMore, fetchProjectsPage]);

  // ── Search ──
  const [searchResults, setSearchResults] = useState<RavelryPattern[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setSearched(false);
    try {
      const res = await fetch(
        `/api/ravelry/search?q=${encodeURIComponent(query.trim())}`
      );
      if (res.status === 401) {
        setConnected(false);
        return;
      }
      if (!res.ok) {
        setSearchError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      setSearchResults(data.patterns || []);
      setSearched(true);
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  return (
    <RavelryDataContext.Provider
      value={{
        connected,
        checking,
        disconnect,
        libraryItems,
        libraryLoading,
        libraryLoaded,
        libraryHasMore,
        libraryError,
        loadLibrary,
        loadMoreLibrary,
        projectItems,
        projectsLoading,
        projectsLoaded,
        projectsHasMore,
        projectsError,
        loadProjects,
        loadMoreProjects,
        searchResults,
        searchLoading,
        searchError,
        searched,
        search,
      }}
    >
      {children}
    </RavelryDataContext.Provider>
  );
}
