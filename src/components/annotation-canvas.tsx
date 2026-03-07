"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pen,
  Square,
  Circle,
  Type,
  ArrowRight,
  Highlighter,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Check,
  Hand,
} from "lucide-react";
import { getAnnotation, saveAnnotation } from "@/app/actions/annotations";

type Tool = "select" | "pen" | "highlighter" | "rect" | "circle" | "text" | "arrow" | "hand";

interface AnnotationCanvasProps {
  documentId: string;
  pageNumber: number;
  scale: number;
  visible: boolean;
  toolbarContainer?: HTMLElement | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export function AnnotationCanvas({
  documentId,
  pageNumber,
  scale,
  visible,
  toolbarContainer,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas>(null);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [strokeColor, setStrokeColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [, forceUpdate] = useState(0);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Auto-save refs
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Drag-to-draw refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawingShapeRef = useRef<any>(null);
  const isDrawingShapeRef = useRef(false);
  const drawOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!fabricRef.current) return;
      const json = fabricRef.current.toJSON();
      await saveAnnotation(documentId, pageNumber, json);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 2000);
  }, [documentId, pageNumber]);

  // Initialize Fabric canvas
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const fabric = await import("fabric");

      if (cancelled || !canvasRef.current) return;

      const parent = canvasRef.current.parentElement;
      if (!parent) return;

      // Wait for parent to have dimensions (PDF may not have rendered yet)
      if (parent.clientWidth === 0 || parent.clientHeight === 0) {
        await new Promise<void>((resolve) => {
          const ro = new ResizeObserver(() => {
            if (parent.clientWidth > 0 && parent.clientHeight > 0) {
              ro.disconnect();
              resolve();
            }
          });
          ro.observe(parent);
        });
        if (cancelled || !canvasRef.current) return;
      }

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: parent.clientWidth,
        height: parent.clientHeight,
        isDrawingMode: true,
      });

      // Fix #7: Initialize PencilBrush immediately so pen works on first open
      const brush = new fabric.PencilBrush(canvas);
      brush.color = strokeColor;
      brush.width = strokeWidth;
      canvas.freeDrawingBrush = brush;

      fabricRef.current = canvas;

      // Load existing annotations
      const existing = await getAnnotation(documentId, pageNumber);
      if (existing?.fabricJson && !cancelled) {
        await canvas.loadFromJSON(existing.fabricJson);
        canvas.renderAll();
      }

      // Save initial state
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = [json];
      historyIndexRef.current = 0;
      isInitializedRef.current = true;

      // History tracking + auto-save on object:added
      canvas.on("object:added", () => {
        if (cancelled) return;
        const jsonStr = JSON.stringify(canvas.toJSON());
        const idx = historyIndexRef.current;
        historyRef.current = historyRef.current.slice(0, idx + 1);
        historyRef.current.push(jsonStr);
        historyIndexRef.current = historyRef.current.length - 1;
        if (isInitializedRef.current) triggerAutoSave();
      });

      canvas.on("object:modified", () => {
        if (cancelled) return;
        triggerAutoSave();
      });

      canvas.on("object:removed", () => {
        if (cancelled) return;
        triggerAutoSave();
      });

      canvas.on("path:created", () => {
        if (cancelled) return;
        triggerAutoSave();
      });
    }

    init();

    return () => {
      cancelled = true;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [documentId, pageNumber, triggerAutoSave]);

  // Force-save when hiding to prevent data loss (bypass 2s debounce)
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (prevVisibleRef.current && !visible) {
      // Was visible, now hidden — flush save immediately
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (fabricRef.current) {
        const json = fabricRef.current.toJSON();
        saveAnnotation(documentId, pageNumber, json);
      }
    }
    prevVisibleRef.current = visible;
  }, [visible, documentId, pageNumber]);

  // Resize canvas when parent size changes (zoom, PDF load, etc.)
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        canvas.setDimensions({ width: el.clientWidth, height: el.clientHeight });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update tool mode
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    (async () => {
      const fabric = await import("fabric");

      if (activeTool === "pen") {
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = strokeColor;
        brush.width = strokeWidth;
        canvas.freeDrawingBrush = brush;
      } else if (activeTool === "highlighter") {
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = strokeColor + "40";
        brush.width = 20;
        canvas.freeDrawingBrush = brush;
      } else {
        canvas.isDrawingMode = false;
      }
    })();
  }, [activeTool, strokeColor, strokeWidth]);

  // Drag-to-draw for rect, circle, arrow; click-to-place for text
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!["rect", "circle", "text", "arrow"].includes(activeTool)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseDown = async (e: any) => {
      const fabric = await import("fabric");
      const pointer = canvas.getViewportPoint(e.e);

      if (activeTool === "text") {
        // Text stays click-to-place
        canvas.add(
          new fabric.IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 18,
            fill: strokeColor,
          })
        );
        setActiveTool("select");
        return;
      }

      // Start drag-to-draw
      isDrawingShapeRef.current = true;
      drawOriginRef.current = { x: pointer.x, y: pointer.y };

      if (activeTool === "rect") {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: strokeColor,
          strokeWidth,
          selectable: false,
          evented: false,
        });
        canvas.add(rect);
        drawingShapeRef.current = rect;
      } else if (activeTool === "circle") {
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: "transparent",
          stroke: strokeColor,
          strokeWidth,
          selectable: false,
          evented: false,
        });
        canvas.add(circle);
        drawingShapeRef.current = circle;
      } else if (activeTool === "arrow") {
        const line = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: strokeColor,
            strokeWidth,
            selectable: false,
            evented: false,
          }
        );
        canvas.add(line);
        drawingShapeRef.current = line;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
      if (!isDrawingShapeRef.current || !drawingShapeRef.current) return;
      const pointer = canvas.getViewportPoint(e.e);
      const origin = drawOriginRef.current;
      const shape = drawingShapeRef.current;

      if (activeTool === "rect") {
        const left = Math.min(origin.x, pointer.x);
        const top = Math.min(origin.y, pointer.y);
        shape.set({
          left,
          top,
          width: Math.abs(pointer.x - origin.x),
          height: Math.abs(pointer.y - origin.y),
        });
      } else if (activeTool === "circle") {
        const dx = pointer.x - origin.x;
        const dy = pointer.y - origin.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        shape.set({
          radius,
          left: origin.x - radius,
          top: origin.y - radius,
        });
      } else if (activeTool === "arrow") {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawingShapeRef.current || !drawingShapeRef.current) return;
      const shape = drawingShapeRef.current;
      shape.set({ selectable: true, evented: true });
      canvas.setActiveObject(shape);
      canvas.renderAll();
      drawingShapeRef.current = null;
      isDrawingShapeRef.current = false;
      setActiveTool("select");
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [activeTool, strokeColor, strokeWidth]);

  async function handleUndo() {
    if (historyIndexRef.current <= 0 || !fabricRef.current) return;
    historyIndexRef.current -= 1;
    await fabricRef.current.loadFromJSON(
      historyRef.current[historyIndexRef.current]
    );
    fabricRef.current.renderAll();
    forceUpdate((n) => n + 1);
  }

  async function handleRedo() {
    if (
      historyIndexRef.current >= historyRef.current.length - 1 ||
      !fabricRef.current
    )
      return;
    historyIndexRef.current += 1;
    await fabricRef.current.loadFromJSON(
      historyRef.current[historyIndexRef.current]
    );
    fabricRef.current.renderAll();
    forceUpdate((n) => n + 1);
  }

  function handleClear() {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
  }

  async function handleSave() {
    if (!fabricRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const json = fabricRef.current.toJSON();
    await saveAnnotation(documentId, pageNumber, json);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }

  const tools: { tool: Tool; icon: React.ElementType; label: string }[] = [
    { tool: "select", icon: ArrowRight, label: "Select" },
    { tool: "pen", icon: Pen, label: "Pen" },
    { tool: "highlighter", icon: Highlighter, label: "Highlighter" },
    { tool: "rect", icon: Square, label: "Rectangle" },
    { tool: "circle", icon: Circle, label: "Circle" },
    { tool: "text", icon: Type, label: "Text" },
    { tool: "arrow", icon: ArrowRight, label: "Arrow" },
    { tool: "hand", icon: Hand, label: "Pan" },
  ];

  const toolbarContent = (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur">
      {tools.map((t) => (
        <Button
          key={t.tool}
          variant={activeTool === t.tool ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setActiveTool(t.tool)}
          title={t.label}
        >
          <t.icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="mx-1 h-8 w-px bg-border" />
      <Input
        type="color"
        value={strokeColor}
        onChange={(e) => setStrokeColor(e.target.value)}
        className="h-8 w-8 cursor-pointer border-0 p-0"
      />
      <div className="mx-1 h-8 w-px bg-border" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} title="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} title="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear} title="Clear">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="default" size="icon" className="h-8 w-8" onClick={handleSave} title="Save">
        <Save className="h-4 w-4" />
      </Button>
      {savedIndicator && (
        <span className="ml-1 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" /> Saved
        </span>
      )}
    </div>
  );

  const isHandTool = activeTool === "hand";
  const passThrough = !visible || isHandTool;

  return (
    <div
      className={`absolute inset-0 z-20 ${passThrough ? "pointer-events-none" : ""}`}
      style={{ touchAction: !passThrough ? "none" : "auto" }}
    >
      {/* Annotation toolbar: portal to parent container or inline fallback */}
      {visible && (
        <>
          {toolbarContainer === undefined ? (
            <div className="absolute left-2 top-2 z-30 pointer-events-auto">{toolbarContent}</div>
          ) : toolbarContainer ? (
            createPortal(toolbarContent, toolbarContainer)
          ) : null}
        </>
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}
