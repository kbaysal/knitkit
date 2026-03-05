"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { getAnnotation, saveAnnotation } from "@/app/actions/annotations";

type Tool = "select" | "pen" | "highlighter" | "rect" | "circle" | "text" | "arrow";

interface AnnotationCanvasProps {
  documentId: string;
  pageNumber: number;
  scale: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export function AnnotationCanvas({
  documentId,
  pageNumber,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas>(null);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [strokeColor, setStrokeColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [, forceUpdate] = useState(0);

  // Initialize Fabric canvas
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const fabric = await import("fabric");

      if (cancelled || !canvasRef.current) return;

      const parent = canvasRef.current.parentElement;
      if (!parent) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: parent.clientWidth,
        height: parent.clientHeight,
        isDrawingMode: true,
      });

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

      canvas.on("object:added", () => {
        if (cancelled) return;
        const jsonStr = JSON.stringify(canvas.toJSON());
        const idx = historyIndexRef.current;
        historyRef.current = historyRef.current.slice(0, idx + 1);
        historyRef.current.push(jsonStr);
        historyIndexRef.current = historyRef.current.length - 1;
      });
    }

    init();

    return () => {
      cancelled = true;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [documentId, pageNumber]);

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

  // Add shapes on click
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!["rect", "circle", "text", "arrow"].includes(activeTool)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = async (e: any) => {
      const fabric = await import("fabric");
      const pointer = canvas.getViewportPoint(e.e);

      if (activeTool === "rect") {
        canvas.add(
          new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 100,
            height: 60,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth,
          })
        );
      } else if (activeTool === "circle") {
        canvas.add(
          new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 40,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth,
          })
        );
      } else if (activeTool === "text") {
        canvas.add(
          new fabric.IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 18,
            fill: strokeColor,
          })
        );
      } else if (activeTool === "arrow") {
        canvas.add(
          new fabric.Line(
            [pointer.x, pointer.y, pointer.x + 100, pointer.y],
            { stroke: strokeColor, strokeWidth }
          )
        );
      }

      setActiveTool("select");
    };

    canvas.on("mouse:down", handler);
    return () => {
      canvas.off("mouse:down", handler);
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
    const json = fabricRef.current.toJSON();
    await saveAnnotation(documentId, pageNumber, json);
  }

  const tools: { tool: Tool; icon: React.ElementType; label: string }[] = [
    { tool: "select", icon: ArrowRight, label: "Select" },
    { tool: "pen", icon: Pen, label: "Pen" },
    { tool: "highlighter", icon: Highlighter, label: "Highlighter" },
    { tool: "rect", icon: Square, label: "Rectangle" },
    { tool: "circle", icon: Circle, label: "Circle" },
    { tool: "text", icon: Type, label: "Text" },
    { tool: "arrow", icon: ArrowRight, label: "Arrow" },
  ];

  return (
    <div className="absolute inset-0 z-20">
      {/* Annotation toolbar */}
      <div className="absolute left-2 top-2 z-30 flex flex-wrap gap-1 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur">
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
      </div>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
