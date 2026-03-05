"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock } from "lucide-react";
import { startTimer, stopTimer } from "@/app/actions/timer";

interface ProjectTimerProps {
  projectId: string;
  sessions: { id: string; startedAt: Date; endedAt: Date | null }[];
  activeSession: { id: string; startedAt: Date; endedAt: Date | null } | null;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

export function ProjectTimer({
  projectId,
  sessions,
  activeSession,
}: ProjectTimerProps) {
  const [active, setActive] = useState(activeSession);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Calculate cumulative time from completed sessions
  const completedTime = sessions
    .filter((s) => s.endedAt)
    .reduce((acc, s) => {
      return acc + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime());
    }, 0);

  useEffect(() => {
    if (active) {
      const updateElapsed = () => {
        setElapsed(Date.now() - new Date(active.startedAt).getTime());
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setElapsed(0);
    }
  }, [active]);

  async function handleToggle() {
    if (active) {
      await stopTimer(active.id);
      setActive(null);
    } else {
      const session = await startTimer(projectId);
      setActive(session);
    }
  }

  const totalTime = completedTime + elapsed;

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="min-w-[120px] text-sm font-mono tabular-nums">
        {formatDuration(totalTime)}
      </span>
      <Button
        variant={active ? "destructive" : "outline"}
        size="sm"
        onClick={handleToggle}
      >
        {active ? (
          <>
            <Pause className="mr-1 h-3 w-3" /> Stop
          </>
        ) : (
          <>
            <Play className="mr-1 h-3 w-3" /> Start
          </>
        )}
      </Button>
    </div>
  );
}
