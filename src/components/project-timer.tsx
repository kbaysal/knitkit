"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Clock } from "lucide-react";
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
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Calculate cumulative time from completed sessions
  const completedTime = sessions
    .filter((s) => s.endedAt)
    .reduce((acc, s) => {
      return acc + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime());
    }, 0);

  useEffect(() => {
    if (active && !paused) {
      const updateElapsed = () => {
        setElapsed(Date.now() - new Date(active.startedAt).getTime());
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [active, paused]);

  async function handleStart() {
    if (paused && active) {
      // Resume — stop the old session (already saved), start a new one
      await stopTimer(active.id);
      const session = await startTimer(projectId);
      setActive(session);
      setPaused(false);
      setPausedElapsed(0);
    } else {
      const session = await startTimer(projectId);
      setActive(session);
      setPaused(false);
      setPausedElapsed(0);
    }
  }

  async function handlePause() {
    if (!active) return;
    // Save elapsed so far, stop the server session, but keep UI in paused state
    await stopTimer(active.id);
    setPausedElapsed((prev) => prev + elapsed);
    setElapsed(0);
    setPaused(true);
    // Keep active reference so UI knows we're paused (not fully stopped)
  }

  async function handleStop() {
    if (active && !paused) {
      await stopTimer(active.id);
    }
    setActive(null);
    setPaused(false);
    setElapsed(0);
    setPausedElapsed(0);
  }

  const totalTime = completedTime + elapsed + pausedElapsed;
  const isRunning = active !== null && !paused;

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="min-w-[120px] text-sm font-mono tabular-nums">
        {formatDuration(totalTime)}
      </span>
      {isRunning ? (
        <>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePause} title="Pause">
            <Pause className="h-3 w-3" />
          </Button>
          <Button variant="destructive" size="icon" className="h-7 w-7" onClick={handleStop} title="Stop">
            <Square className="h-3 w-3" />
          </Button>
        </>
      ) : paused ? (
        <>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleStart} title="Resume">
            <Play className="h-3 w-3" />
          </Button>
          <Button variant="destructive" size="icon" className="h-7 w-7" onClick={handleStop} title="Stop">
            <Square className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleStart} title="Start">
          <Play className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
