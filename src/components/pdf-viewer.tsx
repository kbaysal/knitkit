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
} from "lucide-react";
import { RowRuler } from "@/components/row-ruler";
import { updateRulerPosition } from "@/app/actions/documents";
import { AnnotationCanvas } from "@/components/annotation-canvas";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  document: {
    id: string;
    blobUrl: string;
    filename: string;
    pageCount: number;
    rulerPositions: unknown;
  };
}

export function PdfViewer({ document: doc }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerPositions = (doc.rulerPositions as Record<string, number>) ?? {};

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  function handleRulerChange(position: number) {
    updateRulerPosition(doc.id, pageNumber, position);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2">
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
      </div>

      {/* PDF container */}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-auto rounded-lg border bg-muted/20"
        style={{ maxHeight: "75vh" }}
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
              initialPosition={rulerPositions[String(pageNumber)] ?? 200}
              onPositionChange={handleRulerChange}
            />
            {/* Annotation canvas overlay */}
            {showAnnotations && (
              <AnnotationCanvas
                documentId={doc.id}
                pageNumber={pageNumber}
                scale={scale}
              />
            )}
          </div>
        </Document>
      </div>
    </div>
  );
}
