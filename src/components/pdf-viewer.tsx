"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Pen,
  Maximize2,
  X,
  Hash,
  Clock,
  Bookmark,
  Plus,
  Trash2,
} from "lucide-react";
import { RowRuler } from "@/components/row-ruler";
import { updateRulerPosition } from "@/app/actions/documents";
import { AnnotationCanvas } from "@/components/annotation-canvas";
import {
  getBookmarks,
  createBookmark,
  deleteBookmark,
} from "@/app/actions/bookmarks";
import { Input } from "@/components/ui/input";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type RulerData = Record<string, number | { position: number; height: number }>;

function parseRulerEntry(value: number | { position: number; height: number } | undefined): { position: number; height: number } {
  if (value == null) return { position: 200, height: 32 };
  if (typeof value === "number") return { position: value, height: 32 };
  return value;
}

interface PdfViewerProps {
  document: {
    id: string;
    blobUrl: string;
    filename: string;
    pageCount: number;
    rulerPositions: unknown;
  };
  floatingRowCounter?: React.ReactNode;
  floatingTimer?: React.ReactNode;
}

export function PdfViewer({ document: doc, floatingRowCounter, floatingTimer }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRowCounter, setShowRowCounter] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [annotationToolbarEl, setAnnotationToolbarEl] = useState<HTMLDivElement | null>(null);
  const [bookmarksList, setBookmarksList] = useState<{ id: string; pageNumber: number; name: string; yPosition: number | null }[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [zoomInput, setZoomInput] = useState("");
  const [editingZoom, setEditingZoom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rulerPositions = (doc.rulerPositions as RulerData) ?? {};

  // Load bookmarks
  useEffect(() => {
    getBookmarks(doc.id).then(setBookmarksList);
  }, [doc.id]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  const currentRuler = parseRulerEntry(rulerPositions[String(pageNumber)]);

  function handleRulerChange(position: number, height: number) {
    updateRulerPosition(doc.id, pageNumber, position, height);
  }

  async function handleAddBookmark() {
    const name = newBookmarkName.trim() || `Page ${pageNumber}`;
    const bm = await createBookmark(doc.id, pageNumber, name);
    setBookmarksList((prev) => [...prev, bm]);
    setNewBookmarkName("");
  }

  async function handleDeleteBookmark(id: string) {
    await deleteBookmark(id);
    setBookmarksList((prev) => prev.filter((b) => b.id !== id));
  }

  function handleJumpToBookmark(bm: { pageNumber: number }) {
    setPageNumber(bm.pageNumber);
    setShowBookmarks(false);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          setScale((s) => Math.min(10, s + 0.1));
          break;
        case "-":
          e.preventDefault();
          setScale((s) => Math.max(0.1, s - 0.1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setPageNumber((p) => Math.max(1, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPageNumber((p) => Math.min(numPages || p, p + 1));
          break;
        case "Escape":
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
          break;
        case "f":
          e.preventDefault();
          setIsFullscreen((f) => !f);
          break;
        case "a":
          e.preventDefault();
          setShowAnnotations((a) => !a);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, isFullscreen]);

  // Pinch-to-zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let initialDistance = 0;
    let initialScale = 1;

    function getDistance(t1: Touch, t2: Touch) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const ratio = currentDistance / initialDistance;
        const newScale = Math.min(10, Math.max(0.1, initialScale * ratio));
        setScale(newScale);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [scale]);

  const toolbar = (
    <div
      className={
        isFullscreen
          ? "flex flex-wrap items-center gap-2 rounded-xl border bg-background/80 p-2 shadow-lg backdrop-blur-md"
          : "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2"
      }
    >
      <Button
        variant="outline"
        size="icon"
        disabled={pageNumber <= 1}
        onClick={() => setPageNumber((p) => p - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-2 text-sm">
        {pageNumber} / {numPages || "?"}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={pageNumber >= numPages}
        onClick={() => setPageNumber((p) => p + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        variant="outline"
        size="icon"
        onClick={() => setScale((s) => Math.max(0.1, +(s - 0.1).toFixed(2)))}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      {editingZoom ? (
        <Input
          autoFocus
          className="h-8 w-16 px-1 text-center text-sm"
          value={zoomInput}
          onChange={(e) => setZoomInput(e.target.value)}
          onBlur={() => {
            const v = parseInt(zoomInput, 10);
            if (!isNaN(v) && v >= 10 && v <= 1000) setScale(v / 100);
            setEditingZoom(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseInt(zoomInput, 10);
              if (!isNaN(v) && v >= 10 && v <= 1000) setScale(v / 100);
              setEditingZoom(false);
            } else if (e.key === "Escape") {
              setEditingZoom(false);
            }
          }}
        />
      ) : (
        <button
          className="px-2 text-sm hover:underline cursor-text"
          onClick={() => { setZoomInput(String(Math.round(scale * 100))); setEditingZoom(true); }}
        >
          {Math.round(scale * 100)}%
        </button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setScale((s) => Math.min(10, +(s + 0.1).toFixed(2)))}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        variant={showAnnotations ? "default" : "outline"}
        size="sm"
        onClick={() => setShowAnnotations(!showAnnotations)}
      >
        <Pen className="mr-1 h-4 w-4" />
        Annotate
      </Button>
      {/* Bookmarks toggle */}
      <div className="relative">
        <Button
          variant={showBookmarks ? "default" : "outline"}
          size="icon"
          onClick={() => setShowBookmarks((s) => !s)}
          title="Bookmarks"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
        {showBookmarks && (
          <div className="absolute top-full right-0 z-50 mt-1 w-64 rounded-lg border bg-background p-2 shadow-lg">
            <div className="flex gap-1 mb-2">
              <Input
                placeholder="Bookmark name"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddBookmark(); }}
                className="h-8 text-xs"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddBookmark} title="Add bookmark">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {bookmarksList.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">No bookmarks yet</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {bookmarksList.map((bm) => (
                  <div key={bm.id} className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted">
                    <button
                      className="flex-1 text-left truncate"
                      onClick={() => handleJumpToBookmark(bm)}
                    >
                      <span className="font-medium">{bm.name}</span>
                      <span className="ml-1 text-muted-foreground">p.{bm.pageNumber}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => handleDeleteBookmark(bm.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mx-2 h-6 w-px bg-border" />
      {/* Row counter toggle */}
      {floatingRowCounter && (
        <>
          <Button
            variant={showRowCounter ? "default" : "outline"}
            size="icon"
            onClick={() => setShowRowCounter((s) => !s)}
            title="Row Counter"
          >
            <Hash className="h-4 w-4" />
          </Button>
          {showRowCounter && (
            <div className="[&>div]:border-0 [&>div]:p-0 [&>div]:shadow-none">
              {floatingRowCounter}
            </div>
          )}
        </>
      )}
      {/* Timer toggle */}
      {floatingTimer && (
        <>
          <Button
            variant={showTimer ? "default" : "outline"}
            size="icon"
            onClick={() => setShowTimer((s) => !s)}
            title="Timer"
          >
            <Clock className="h-4 w-4" />
          </Button>
          {showTimer && (
            <div className="[&>div]:border-0 [&>div]:p-0 [&>div]:shadow-none">
              {floatingTimer}
            </div>
          )}
        </>
      )}
      <div className="mx-2 h-6 w-px bg-border" />
      {isFullscreen ? (
        <Button variant="outline" size="icon" onClick={() => setIsFullscreen(false)} title="Exit fullscreen">
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" size="icon" onClick={() => setIsFullscreen(true)} title="Fullscreen">
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const pdfContent = (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "relative h-full w-full overflow-auto"
          : "relative mx-auto flex-1 min-h-0 overflow-auto rounded-lg border bg-muted/20"
      }
    >
      <Document
        file={doc.blobUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex h-96 items-center justify-center text-muted-foreground">
            Loading PDF...
          </div>
        }
      >
        <div className="relative inline-block">
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="mx-auto"
          />
          {/* Row ruler overlay */}
          <RowRuler
            initialPosition={currentRuler.position}
            initialHeight={currentRuler.height}
            scale={scale}
            onPositionChange={handleRulerChange}
          />
          {/* Annotation canvas overlay — always mounted, visibility controlled via prop */}
          <AnnotationCanvas
            documentId={doc.id}
            pageNumber={pageNumber}
            scale={scale}
            visible={showAnnotations}
            toolbarContainer={annotationToolbarEl}
          />
        </div>
      </Document>
    </div>
  );

  if (isFullscreen) {
    return (
      <div ref={wrapperRef} className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="relative flex-shrink-0 flex flex-col items-center gap-2 p-3">
          {toolbar}
          <div ref={setAnnotationToolbarEl} className="absolute top-full left-1/2 z-50 -translate-x-1/2" />
        </div>
        <div className="flex-1 overflow-hidden">
          {pdfContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="relative flex-shrink-0">
        {toolbar}
        <div ref={setAnnotationToolbarEl} className="absolute top-full left-1/2 z-30 -translate-x-1/2 mt-1" />
      </div>
      {pdfContent}
    </div>
  );
}
