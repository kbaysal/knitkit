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
} from "lucide-react";
import { RowRuler } from "@/components/row-ruler";
import { updateRulerPosition } from "@/app/actions/documents";
import { AnnotationCanvas } from "@/components/annotation-canvas";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rulerPositions = (doc.rulerPositions as RulerData) ?? {};

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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          setScale((s) => Math.min(3, s + 0.1));
          break;
        case "-":
          e.preventDefault();
          setScale((s) => Math.max(0.5, s - 0.1));
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
        const newScale = Math.min(3, Math.max(0.5, initialScale * ratio));
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
        onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="px-2 text-sm">{Math.round(scale * 100)}%</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setScale((s) => Math.min(3, s + 0.1))}
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
          : "relative mx-auto overflow-auto rounded-lg border bg-muted/20"
      }
      style={isFullscreen ? undefined : { maxHeight: "75vh" }}
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
            onPositionChange={handleRulerChange}
          />
          {/* Annotation canvas overlay */}
          {showAnnotations && (
            <AnnotationCanvas
              documentId={doc.id}
              pageNumber={pageNumber}
              scale={scale}
              toolbarContainer={annotationToolbarEl}
            />
          )}
        </div>
      </Document>
    </div>
  );

  if (isFullscreen) {
    return (
      <div ref={wrapperRef} className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="relative flex-shrink-0 flex flex-col items-center gap-2 p-3">
          {toolbar}
          {showAnnotations && (
            <div ref={setAnnotationToolbarEl} className="absolute top-full left-1/2 z-50 -translate-x-1/2" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {pdfContent}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {toolbar}
        {showAnnotations && (
          <div ref={setAnnotationToolbarEl} className="absolute top-full left-1/2 z-30 -translate-x-1/2 mt-1" />
        )}
      </div>
      {pdfContent}
    </div>
  );
}
