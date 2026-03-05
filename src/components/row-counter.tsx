"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { updateProject } from "@/app/actions/projects";

interface RowCounterProps {
  projectId: string;
  currentRow: number;
  totalRows: number;
  onRowChange: (row: number) => void;
}

export function RowCounter({
  projectId,
  currentRow,
  totalRows,
  onRowChange,
}: RowCounterProps) {
  async function handleChange(delta: number) {
    const newRow = Math.max(0, Math.min(currentRow + delta, totalRows || Infinity));
    onRowChange(newRow);
    await updateProject(projectId, { currentRow: newRow });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">Row</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleChange(-1)}
        disabled={currentRow <= 0}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-[3ch] text-center text-lg font-bold tabular-nums">
        {currentRow}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleChange(1)}
        disabled={totalRows > 0 && currentRow >= totalRows}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
